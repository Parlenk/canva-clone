import { fabric } from 'fabric';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  type BuildEditorProps,
  CIRCLE_OPTIONS,
  DIAMOND_OPTIONS,
  type Editor,
  EditorHookProps,
  FILL_COLOR,
  FONT_FAMILY,
  FONT_LINETHROUGH,
  FONT_SIZE,
  FONT_STYLE,
  FONT_UNDERLINE,
  FONT_WEIGHT,
  JSON_KEYS,
  RECTANGLE_OPTIONS,
  STROKE_COLOR,
  STROKE_DASH_ARRAY,
  STROKE_WIDTH,
  TEXT_ALIGN,
  TEXT_OPTIONS,
  TRIANGLE_OPTIONS,
} from '@/features/editor/types';
import { createFilter, downloadFile, isTextType, transformText } from '@/features/editor/utils';
import { generateAIResizeInstructions, extractCanvasObjects } from '@/features/editor/services/ai-resize';

import { useAutoResize } from './use-auto-resize';
import { useCanvasEvents } from './use-canvas-events';
import { useClipboard } from './use-clipboard';
import { useHistory } from './use-history';
import { useHotkeys } from './use-hotkeys';
import { useLoadState } from './use-load-state';

const buildEditor = ({
  save,
  canRedo,
  canUndo,
  undo,
  redo,
  autoZoom,
  copy,
  paste,
  canvas,
  fillColor,
  setFillColor,
  strokeColor,
  setStrokeColor,
  strokeWidth,
  setStrokeWidth,
  strokeDashArray,
  setStrokeDashArray,
  fontFamily,
  setFontFamily,
  selectedObjects,
}: BuildEditorProps): Editor => {
  const addToCanvas = (object: fabric.Object) => {
    console.log('=== addToCanvas called ===');
    console.log('Object type:', object.type);
    console.log('Object dimensions:', { width: object.width, height: object.height });
    console.log('Canvas objects before add:', canvas.getObjects().length);
    
    try {
      center(object);
      console.log('Object centered at:', { left: object.left, top: object.top });
      
      canvas.add(object);
      console.log('Object added to canvas');
      console.log('Canvas objects after add:', canvas.getObjects().length);
      
      canvas.setActiveObject(object);
      console.log('Object set as active');
      
      canvas.renderAll();
      console.log('Canvas rendered');
    } catch (error) {
      console.error('❌ Error in addToCanvas:', error);
    }
  };

  const generateSaveOptions = () => {
    const { width, height, left, top } = getWorkspace() as fabric.Rect;

    return {
      name: 'Image',
      format: 'png',
      quality: 1,
      width,
      height,
      left,
      top,
    };
  };

  const savePNG = () => {
    const options = generateSaveOptions();
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

    const dataUrl = canvas.toDataURL(options);

    downloadFile(dataUrl, 'png');
    autoZoom();
  };

  const saveJPEG = () => {
    const options = generateSaveOptions();
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

    const dataUrl = canvas.toDataURL(options);

    downloadFile(dataUrl, 'jpeg');
    autoZoom();
  };

  const saveJPG = () => {
    const options = generateSaveOptions();
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

    const dataUrl = canvas.toDataURL(options);

    downloadFile(dataUrl, 'jpg');
    autoZoom();
  };

  const saveJSON = async () => {
    const dataUrl = canvas.toJSON(JSON_KEYS);

    await transformText(dataUrl.objects);

    const fileString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataUrl, null, '\t'))}`;

    downloadFile(fileString, 'json');
  };

  const loadJSON = (json: string) => {
    const data = JSON.parse(json);

    canvas.loadFromJSON(data, () => {
      autoZoom();
    });
  };

  const getWorkspace = () => {
    return canvas.getObjects().find((object) => object.name === 'clip');
  };

  const center = (object: fabric.Object) => {
    // Center object in the visible canvas viewport
    const canvasCenter = canvas.getCenter();
    
    // Transform the center point to account for zoom and pan
    const vpt = canvas.viewportTransform;
    if (vpt) {
      const centerX = (canvasCenter.left - vpt[4]) / vpt[0];
      const centerY = (canvasCenter.top - vpt[5]) / vpt[3];
      
      object.set({
        left: centerX,
        top: centerY,
      });
    } else {
      object.set({
        left: canvasCenter.left,
        top: canvasCenter.top,
      });
    }
    
    object.setCoords();
  };

  return {
    savePNG,
    saveJPG,
    saveJPEG,
    saveJSON,
    loadJSON,
    autoZoom,
    canUndo,
    canRedo,
    getWorkspace,
    zoomIn: () => {
      let zoomRatio = canvas.getZoom();
      zoomRatio += 0.05;

      const center = canvas.getCenter();
      canvas.zoomToPoint(new fabric.Point(center.left, center.top), zoomRatio > 2 ? 2 : zoomRatio);
    },
    zoomOut: () => {
      let zoomRatio = canvas.getZoom();
      zoomRatio -= 0.05;

      const center = canvas.getCenter();
      canvas.zoomToPoint(new fabric.Point(center.left, center.top), zoomRatio < 0.2 ? 0.2 : zoomRatio);
    },
    changeSize: (size: { width: number; height: number }) => {
      console.log('=== changeSize function called ===');
      console.log('Requested size:', size);
      
      const workspace = getWorkspace();
      console.log('Workspace found:', !!workspace);
      
      if (workspace) {
        console.log('Current workspace size:', { width: workspace.width, height: workspace.height });
        workspace.set(size);
        workspace.setCoords(); // Force coordinate update
        canvas.renderAll(); // Force re-render
        console.log('Workspace resized, calling autoZoom...');
        autoZoom();
        save();
        console.log('=== changeSize complete ===');
      } else {
        console.error('No workspace found! Cannot resize.');
      }
    },
    aiPoweredResize: async (currentSize: { width: number; height: number }, newSize: { width: number; height: number }) => {
      console.log('=== AI-Powered Resize Starting ===');
      console.log('Current size:', currentSize);
      console.log('New size:', newSize);

      try {
        // First, resize the workspace
        const workspace = getWorkspace();
        if (!workspace) {
          console.error('No workspace found!');
          return;
        }

        // Extract current objects for AI analysis
        const canvasObjects = extractCanvasObjects(canvas);
        console.log('Extracted objects for AI analysis:', canvasObjects);

        // Get AI instructions for object placement
        console.log('Requesting AI resize instructions...');
        const instructions = await generateAIResizeInstructions(currentSize, newSize, canvasObjects, canvas);
        console.log('Received AI instructions:', instructions);

        // Resize workspace first
        workspace.set(newSize);
        workspace.setCoords();

        // Apply AI instructions to each object
        const objects = canvas.getObjects().filter(obj => obj.name !== 'clip');
        objects.forEach((obj, index) => {
          const instruction = instructions.objects.find(inst => inst.id === `obj_${index}`);
          if (instruction) {
            obj.set({
              left: instruction.left,
              top: instruction.top,
              scaleX: instruction.scaleX,
              scaleY: instruction.scaleY,
            });
            obj.setCoords();
          }
        });

        // Force multiple renders to ensure canvas is properly updated
        canvas.renderAll();
        
        // Add a small delay to ensure rendering is complete before final operations
        setTimeout(() => {
          canvas.renderAll();
          autoZoom();
          save();
          console.log('=== AI-Powered Resize Complete ===');
        }, 50);

        // Return the enhanced AI analysis results for UI display
        return instructions;

      } catch (error) {
        console.error('❌ TRUE AI resize failed - NO FALLBACKS ALLOWED');
        console.error('❌ Error details:', error);
        // NO FALLBACKS - Show error to user
        throw new Error(`TRUE AI ONLY MODE: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    changeBackground: (background: string) => {
      const workspace = getWorkspace();

      workspace?.set({ fill: background });
      canvas.renderAll();

      save();
    },
    enableDrawingMode: () => {
      canvas.discardActiveObject();
      canvas.renderAll();

      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = strokeWidth;
      canvas.freeDrawingBrush.color = strokeColor;
    },
    disableDrawingMode: () => {
      canvas.isDrawingMode = false;
    },
    onUndo: () => undo(),
    onRedo: () => redo(),
    onCopy: () => copy(),
    onPaste: () => paste(),
    changeImageFilter: (effect) => {
      const objects = canvas.getActiveObjects();

      objects.forEach((object) => {
        if (object.type === 'image') {
          const imageObject = object as fabric.Image;

          const filter = createFilter(effect);

          imageObject.filters = filter ? [filter] : [];

          imageObject.applyFilters();
          canvas.renderAll();
        }
      });
    },
    addImage: (imageUrl) => {
      console.log('=== addImage called ===');
      console.log('Image URL length:', imageUrl?.length);
      console.log('Canvas available:', !!canvas);
      console.log('Image URL preview:', imageUrl?.substring(0, 50) + '...');
      
      try {
        fabric.Image.fromURL(
          imageUrl,
          (image) => {
            console.log('=== fabric.Image.fromURL callback ===');
            console.log('Image object created:', !!image);
            
            if (!image) {
              console.error('❌ fabric.Image.fromURL failed to create image');
              return;
            }
            
            console.log('Image dimensions:', { width: image.width, height: image.height });
            console.log('Image element:', image.getElement());
            
            // Wait for image to fully load before checking dimensions
            const checkAndAddImage = () => {
              const element = image.getElement() as HTMLImageElement;
              const imageWidth = image.width || element?.naturalWidth || 1;
              const imageHeight = image.height || element?.naturalHeight || 1;
              
              console.log('Final image size check:', { imageWidth, imageHeight });
              
              if (!imageWidth || !imageHeight || imageWidth === 1 || imageHeight === 1) {
                console.error('❌ Image has invalid dimensions, retrying in 100ms...');
                setTimeout(checkAndAddImage, 100);
                return;
              }
              
              // Scale image to a reasonable size (max 400px width/height)
              const maxSize = 400;
              
              console.log('Original image size:', { imageWidth, imageHeight });
              
              if (imageWidth > maxSize || imageHeight > maxSize) {
                const scale = Math.min(maxSize / imageWidth, maxSize / imageHeight);
                console.log('Scaling image by factor:', scale);
                image.scale(scale);
              }

              console.log('Adding image to canvas...');
              try {
                addToCanvas(image);
                console.log('✅ Image added to canvas successfully');
                
                // Manually trigger save to ensure persistence
                setTimeout(() => {
                  save();
                  console.log('Image save triggered');
                }, 100);
              } catch (error) {
                console.error('❌ Error adding image to canvas:', error);
              }
            };
            
            // Start the dimension check
            checkAndAddImage();
          },
          // Don't use crossOrigin for data URLs, only for external URLs
          imageUrl.startsWith('data:') ? {} : { crossOrigin: 'anonymous' },
        );
      } catch (error) {
        console.error('❌ Error in fabric.Image.fromURL:', error);
      }
    },
    addCpaButton: (options) => {
      console.log('=== addCpaButton called ===', options);
      
      try {
        const {
          text,
          backgroundColor,
          textColor,
          borderRadius,
          padding,
          fontSize,
          fontWeight
        } = options;

        // Create the button rectangle
        const buttonWidth = Math.max(text.length * fontSize * 0.6 + padding * 2, 120);
        const buttonHeight = fontSize + padding * 2;

        const button = new fabric.Rect({
          left: 100,
          top: 100,
          width: buttonWidth,
          height: buttonHeight,
          fill: backgroundColor,
          stroke: 'transparent',
          strokeWidth: 0,
          rx: borderRadius,
          ry: borderRadius,
          selectable: true,
          evented: true,
          name: 'cpa-button-background'
        });

        // Create the button text
        const buttonText = new fabric.Textbox(text, {
          left: 100 + buttonWidth / 2,
          top: 100 + buttonHeight / 2,
          width: buttonWidth - padding * 2,
          height: buttonHeight - padding * 2,
          fontSize: fontSize,
          fill: textColor,
          fontFamily: 'Arial',
          fontWeight: fontWeight,
          textAlign: 'center',
          originX: 'center',
          originY: 'center',
          selectable: true,
          evented: true,
          name: 'cpa-button-text'
        });

        // Create a group for the button
        const buttonGroup = new fabric.Group([button, buttonText], {
          left: 100,
          top: 100,
          selectable: true,
          evented: true,
          name: 'cpa-button',
          data: {
            type: 'cta-button',
            text: text,
            backgroundColor: backgroundColor,
            textColor: textColor
          }
        });

        console.log('Adding CPA button to canvas...', buttonGroup);
        addToCanvas(buttonGroup);
        console.log('✅ CPA button added to canvas successfully');
        
        // Manually trigger save
        setTimeout(() => {
          save();
          console.log('CPA button save triggered');
        }, 100);
        
      } catch (error) {
        console.error('❌ Error adding CPA button:', error);
      }
    },
    delete: () => {
      canvas.getActiveObjects().forEach((object) => canvas.remove(object));
      canvas.discardActiveObject();

      canvas.renderAll();
    },
    changeOpacity: (opacity) => {
      canvas.getActiveObjects().forEach((object) => {
        object.set({ opacity });
      });

      canvas.renderAll();
    },
    bringForward: () => {
      canvas.getActiveObjects().forEach((object) => {
        canvas.bringForward(object);
      });

      canvas.renderAll();

      const workspace = getWorkspace();
      workspace?.sendToBack();
    },
    sendBackwards: () => {
      canvas.getActiveObjects().forEach((object) => {
        canvas.sendBackwards(object);
      });

      canvas.renderAll();

      const workspace = getWorkspace();
      workspace?.sendToBack();
    },
    changeFontSize: (fontSize) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) object._set('fontSize', fontSize);
      });

      canvas.renderAll();
    },
    changeTextAlign: (textAlign) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) object._set('textAlign', textAlign);
      });

      canvas.renderAll();
    },
    changeFontUnderline: (underline) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) object._set('underline', underline);
      });

      canvas.renderAll();
    },
    changeFontLinethrough: (linethrough) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) object._set('linethrough', linethrough);
      });

      canvas.renderAll();
    },
    changeFontStyle: (fontStyle) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) object._set('fontStyle', fontStyle);
      });

      canvas.renderAll();
    },
    changeFontWeight: (fontWeight) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) object._set('fontWeight', fontWeight);
      });

      canvas.renderAll();
    },
    changeFontFamily: (fontFamily) => {
      setFontFamily(fontFamily);

      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) object._set('fontFamily', fontFamily);
      });

      canvas.renderAll();
    },
    changeFillColor: (color) => {
      setFillColor(color);

      canvas.getActiveObjects().forEach((object) => object.set({ fill: color }));
      canvas.renderAll();
    },
    changeStrokeColor: (color) => {
      setStrokeColor(color);

      canvas.getActiveObjects().forEach((object) => {
        // Text types don't have strokes
        if (isTextType(object.type)) {
          object.set({ fill: color });
          return;
        }

        object.set({ stroke: color });
      });

      canvas.freeDrawingBrush.color = color;
      canvas.renderAll();
    },
    changeStrokeWidth: (width) => {
      setStrokeWidth(width);

      canvas.getActiveObjects().forEach((object) => object.set({ strokeWidth: width }));

      canvas.freeDrawingBrush.width = width;
      canvas.renderAll();
    },
    changeStrokeDashArray: (strokeDashArray: number[]) => {
      setStrokeDashArray(strokeDashArray);

      canvas.getActiveObjects().forEach((object) => object.set({ strokeDashArray }));
      canvas.renderAll();
    },
    addText: (value, options) => {
      const object = new fabric.Textbox(value, {
        ...TEXT_OPTIONS,
        fill: fillColor,
        ...options,
      });

      addToCanvas(object);
    },
    addCircle: () => {
      const object = new fabric.Circle({
        ...CIRCLE_OPTIONS,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth,
        strokeDashArray,
      });

      addToCanvas(object);
    },
    addSoftRectangle: () => {
      const object = new fabric.Rect({
        ...RECTANGLE_OPTIONS,
        rx: 50,
        ry: 50,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth,
        strokeDashArray,
      });

      addToCanvas(object);
    },
    addRectangle: () => {
      const object = new fabric.Rect({
        ...RECTANGLE_OPTIONS,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth,
        strokeDashArray,
      });

      addToCanvas(object);
    },
    addTriangle: () => {
      const object = new fabric.Triangle({
        ...TRIANGLE_OPTIONS,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth,
        strokeDashArray,
      });

      addToCanvas(object);
    },
    addInverseTriangle: () => {
      const HEIGHT = TRIANGLE_OPTIONS.height;
      const WIDTH = TRIANGLE_OPTIONS.width;

      const object = new fabric.Polygon(
        [
          {
            x: 0,
            y: 0,
          },
          {
            x: WIDTH,
            y: 0,
          },
          {
            x: WIDTH / 2,
            y: HEIGHT,
          },
        ],
        {
          ...TRIANGLE_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth,
          strokeDashArray,
        },
      );

      addToCanvas(object);
    },
    addDiamond: () => {
      const HEIGHT = DIAMOND_OPTIONS.height;
      const WIDTH = DIAMOND_OPTIONS.width;

      const object = new fabric.Polygon(
        [
          {
            x: WIDTH / 2,
            y: 0,
          },
          {
            x: WIDTH,
            y: HEIGHT / 2,
          },
          {
            x: WIDTH / 2,
            y: HEIGHT,
          },
          {
            x: 0,
            y: HEIGHT / 2,
          },
        ],
        {
          ...DIAMOND_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth,
          strokeDashArray,
        },
      );

      addToCanvas(object);
    },
    getActiveFontSize: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) return FONT_SIZE;

      // @ts-ignore fontSize attribute types aren't added.
      const value = selectedObject.get('fontSize') || FONT_SIZE;

      return value as number;
    },
    getActiveTextAlign: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) return TEXT_ALIGN;

      // @ts-ignore textAlign attribute types aren't added.
      const value = selectedObject.get('textAlign') || TEXT_ALIGN;

      return value as string;
    },
    getActiveFontUnderline: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) return FONT_UNDERLINE;

      // @ts-ignore underline attribute types aren't added.
      const value = selectedObject.get('underline') || FONT_UNDERLINE;

      return value as boolean;
    },
    getActiveFontLinethrough: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) return FONT_LINETHROUGH;

      // @ts-ignore linethrough attribute types aren't added.
      const value = selectedObject.get('linethrough') || FONT_LINETHROUGH;

      return value as boolean;
    },
    getActiveFontStyle: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) return FONT_STYLE;

      // @ts-ignore fontStyle attribute types aren't added.
      const value = selectedObject.get('fontStyle') || FONT_STYLE;

      return value as string;
    },
    getActiveFontWeight: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) return FONT_WEIGHT;

      // @ts-ignore fontWeight attribute types aren't added.
      const value = selectedObject.get('fontWeight') || FONT_WEIGHT;

      return value as number;
    },
    getActiveFontFamily: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) return fontFamily;

      // @ts-ignore fontFamily attribute types aren't added.
      const value = selectedObject.get('fontFamily') || fontFamily;

      return value as string;
    },
    getActiveOpacity: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) return 1;

      const value = selectedObject.get('opacity') || 1;

      return value;
    },
    getActiveFillColor: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) return fillColor;

      const value = selectedObject.get('fill') || fillColor;

      // Gradients and patterns are not passed.
      return value as string;
    },
    getActiveStrokeColor: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) return strokeColor;

      const value = selectedObject.get('stroke') || strokeColor;

      return value;
    },
    getActiveStrokeWidth: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) return strokeWidth;

      const value = selectedObject.get('strokeWidth') || strokeWidth;

      return value;
    },
    getActiveStrokeDashArray: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) return strokeDashArray;

      const value = selectedObject.get('strokeDashArray') || strokeDashArray;

      return value;
    },
    importAdobeAI: (canvasData: any) => {
      try {
        console.log('🎯 [STEP 5] importAdobeAI called with canvas data:', canvasData);
        console.log('🎯 [STEP 6] Canvas available?', !!canvas);
        
        // Validate the canvas data structure
        if (!canvasData || typeof canvasData !== 'object') {
          console.error('❌ [STEP 6] Invalid canvas data provided');
          throw new Error('Invalid canvas data provided');
        }
        
        console.log('🎯 [STEP 7] Canvas data validation passed');

        // Ensure we have proper canvas dimensions
        const width = canvasData.width || 800;
        const height = canvasData.height || 600;
        
        console.log(`📐 Setting canvas size to ${width}x${height}`);
        
        // Clear existing canvas content
        canvas.clear();
        
        // Set canvas dimensions first
        canvas.setWidth(width);
        canvas.setHeight(height);
        
        // Create workspace background if it doesn't exist
        let workspace = getWorkspace();
        if (!workspace) {
          console.log('🎨 Creating new workspace for Adobe AI import');
          workspace = new fabric.Rect({
            name: 'clip',
            width: width,
            height: height,
            fill: canvasData.background || '#ffffff',
            selectable: false,
            hasControls: false,
            shadow: new fabric.Shadow({
              color: 'rgba(0,0,0,0.8)',
              blur: 5,
              offsetX: 0,
              offsetY: 0,
            }),
          });
          canvas.add(workspace);
          canvas.centerObject(workspace);
        } else {
          // Update existing workspace size
          workspace.set({
            width: width,
            height: height
          });
        }
        
        console.log('🎯 [STEP 8] Setting canvas dimensions and clearing canvas');

        // Load the objects if available
        if (canvasData.objects && Array.isArray(canvasData.objects)) {
          console.log(`🎯 [STEP 9] Loading ${canvasData.objects.length} objects`);
          console.log('🎯 [STEP 10] Objects to load:', canvasData.objects);
          
          // Instead of loadFromJSON, manually add objects for better debugging
          let loadedObjects = 0;
          
          for (let i = 0; i < canvasData.objects.length; i++) {
            const objectData = canvasData.objects[i];
            try {
              console.log(`🎯 [STEP 10.${i + 1}] Creating fabric object ${i + 1}/${canvasData.objects.length}:`, objectData);
              
              let fabricObject;
              switch (objectData.type) {
                case 'rect':
                  console.log(`🎯 Creating fabric.Rect with:`, objectData);
                  fabricObject = new fabric.Rect(objectData);
                  break;
                case 'text':
                  console.log(`🎯 Creating fabric.Text with:`, objectData);
                  fabricObject = new fabric.Text(objectData.text || 'Imported Text', objectData);
                  break;
                case 'path':
                  console.log(`🎯 Creating fabric.Path with:`, objectData);
                  fabricObject = new fabric.Path(objectData.path, objectData);
                  break;
                default:
                  console.warn('❓ Unknown object type:', objectData.type);
                  continue;
              }
              
              if (fabricObject) {
                console.log('🎯 [STEP 11] Successfully created fabric object:', {
                  type: fabricObject.type,
                  left: fabricObject.left,
                  top: fabricObject.top,
                  width: fabricObject.width,
                  height: fabricObject.height
                });
                console.log('🎯 [STEP 12] Adding to canvas...');
                canvas.add(fabricObject);
                loadedObjects++;
                console.log('🎯 [STEP 13] Current canvas object count:', canvas.getObjects().length);
                console.log('🎯 [STEP 14] Canvas objects:', canvas.getObjects().map(o => ({ type: o.type, id: o.id || 'no-id' })));
              } else {
                console.warn('❌ [STEP 11] Failed to create fabric object from:', objectData);
              }
            } catch (error) {
              console.error('❌ Failed to create object:', objectData, error);
            }
          }
          
          console.log(`🎯 [STEP 13] Successfully loaded ${loadedObjects}/${canvasData.objects.length} objects`);
          console.log('🎯 [STEP 14] Final canvas objects:', canvas.getObjects().map(o => ({ type: o.type, id: o.id || 'no-id' })));
          
          // Ensure workspace is at the back
          const workspace = getWorkspace();
          if (workspace) {
            console.log('🎯 [STEP 15] Sending workspace to back');
            workspace.sendToBack();
          }
          
          console.log('🎯 [STEP 16] Auto-zooming and rendering canvas');
          // Auto-zoom to fit content
          autoZoom();
          
          // Save the state
          save();
          
          canvas.renderAll();
          console.log('🎯 [STEP 17] Canvas render complete');
        } else {
          console.log('⚠️ No objects found in canvas data, just updating canvas size');
          autoZoom();
          save();
          canvas.renderAll();
        }
        
      } catch (error) {
        console.error('❌ Failed to import Adobe AI data:', error);
        // Don't re-throw to prevent breaking the UI
        // Instead, show a user-friendly error
        toast.error('Failed to import AI file. Please try a different file or contact support.');
      }
    },

    canvas,
    selectedObjects,
  };
};

export const useEditor = ({ defaultState, defaultWidth, defaultHeight, clearSelectionCallback, saveCallback }: EditorHookProps) => {
  const initialState = useRef(defaultState);
  const initialWidth = useRef(defaultWidth);
  const initialHeight = useRef(defaultHeight);

  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<fabric.Object[]>([]);

  const [fontFamily, setFontFamily] = useState(FONT_FAMILY);
  const [fillColor, setFillColor] = useState(FILL_COLOR);
  const [strokeColor, setStrokeColor] = useState(STROKE_COLOR);
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTH);
  const [strokeDashArray, setStrokeDashArray] = useState<number[]>(STROKE_DASH_ARRAY);

  const { save, canRedo, canUndo, undo, redo, canvasHistory, setHistoryIndex } = useHistory({
    canvas,
    saveCallback,
  });

  const { copy, paste } = useClipboard({
    canvas,
  });

  const { autoZoom } = useAutoResize({
    canvas,
    container,
  });

  useCanvasEvents({
    canvas,
    save,
    setSelectedObjects,
    clearSelectionCallback,
  });

  useHotkeys({
    canvas,
    undo,
    redo,
    save,
    copy,
    paste,
  });

  useLoadState({
    canvas,
    autoZoom,
    initialState,
    canvasHistory,
    setHistoryIndex,
  });

  fabric.Object.prototype.set({
    cornerColor: '#fff',
    cornerStyle: 'circle',
    borderColor: '#3b82f6',
    borderScaleFactor: 1.5,
    transparentCorners: false,
    borderOpacityWhenMoving: 1,
    cornerStrokeColor: '#3b82f6',
  });

  const editor = useMemo(() => {
    if (canvas)
      return buildEditor({
        save,
        canRedo,
        canUndo,
        undo,
        redo,
        autoZoom,
        copy,
        paste,
        canvas,
        fillColor,
        setFillColor,
        strokeColor,
        setStrokeColor,
        strokeWidth,
        setStrokeWidth,
        strokeDashArray,
        setStrokeDashArray,
        fontFamily,
        setFontFamily,
        selectedObjects,
      });

    return undefined;
  }, [
    save,
    canRedo,
    canUndo,
    undo,
    redo,
    autoZoom,
    copy,
    paste,
    canvas,
    fillColor,
    strokeColor,
    strokeWidth,
    strokeDashArray,
    fontFamily,
    selectedObjects,
  ]);

  const init = useCallback(
    ({ initialCanvas, initialContainer }: { initialCanvas: fabric.Canvas; initialContainer: HTMLDivElement }) => {
      const initialWorkspace = new fabric.Rect({
        width: initialWidth.current,
        height: initialHeight.current,
        name: 'clip',
        fill: 'white',
        selectable: false,
        hasControls: false,
        shadow: new fabric.Shadow({
          color: 'rgba(0, 0, 0, 0.8)',
          blur: 5,
        }),
      });

      initialCanvas.setWidth(initialContainer.offsetWidth);
      initialCanvas.setHeight(initialContainer.offsetHeight);

      initialCanvas.add(initialWorkspace);
      initialCanvas.centerObject(initialWorkspace);
      initialCanvas.clipPath = initialWorkspace;

      setCanvas(initialCanvas);
      setContainer(initialContainer);

      const currentState = JSON.stringify(initialCanvas.toJSON(JSON_KEYS));

      canvasHistory.current = [currentState];
      setHistoryIndex(0);
    },
    // No need, this is from set state
    [canvasHistory, setHistoryIndex],
  );

  return { init, editor };
};
