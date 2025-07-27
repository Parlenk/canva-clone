import { fabric } from 'fabric';
import { useCallback, useMemo, useRef, useState } from 'react';

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

        canvas.renderAll();
        autoZoom();
        save();
        console.log('=== AI-Powered Resize Complete ===');
      } catch (error) {
        console.error('AI-Powered resize failed:', error);
        // Fallback to basic resize
        console.log('Falling back to basic resize...');
        const fallbackWorkspace = getWorkspace();
        if (fallbackWorkspace) {
          fallbackWorkspace.set(newSize);
          fallbackWorkspace.setCoords();
          canvas.renderAll();
          autoZoom();
          save();
        }
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
