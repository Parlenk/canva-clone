import { fabric } from 'fabric';
import { useCallback } from 'react';

import {
  analyzeObjects,
  applyLayout,
  centerFocusLayout,
  gridLayout,
  proportionalLayout,
  type ResizeStrategy,
  smartReflowLayout,
  type LayoutBounds,
} from '../utils/layout-algorithms';

import {
  AILayoutEngine,
  analyzeObjectsWithAI,
  type LayoutPosition,
} from '../utils/ai-layout-engine';

interface UseSmartResizeProps {
  canvas: fabric.Canvas | null;
  getWorkspace: () => fabric.Object | undefined;
  autoZoom: () => void;
  save: () => void;
}

export const useSmartResize = ({ canvas, getWorkspace, autoZoom, save }: UseSmartResizeProps) => {
  const smartResize = useCallback(
    (newSize: { width: number; height: number }, strategy: ResizeStrategy = 'proportional') => {
      console.log('smartResize called with:', { newSize, strategy });
      if (!canvas) {
        console.log('No canvas available');
        return;
      }

      // Get or create workspace bounds
      let workspace = getWorkspace() as fabric.Rect;
      let oldBounds: LayoutBounds;
      let newBounds: LayoutBounds;

      if (!workspace) {
        console.log('No workspace found, trying to find white canvas area...');
        
        // Try to find the white background rectangle (the actual design canvas)
        const allObjects = canvas.getObjects();
        const backgroundRect = allObjects.find(obj => 
          obj.type === 'rect' && 
          obj.fill === 'white' && 
          !obj.selectable
        );
        
        if (backgroundRect) {
          console.log('Found white background rectangle as workspace');
          workspace = backgroundRect as fabric.Rect;
          
          oldBounds = {
            width: workspace.width || 0,
            height: workspace.height || 0,
            left: workspace.left || 0,
            top: workspace.top || 0,
          };

          newBounds = {
            width: newSize.width,
            height: newSize.height,
            left: workspace.left || 0,
            top: workspace.top || 0,
          };

          // Apply the new workspace size and force update
          console.log(`Resizing workspace from ${workspace.width}x${workspace.height} to ${newSize.width}x${newSize.height}`);
          workspace.set({
            width: newSize.width,
            height: newSize.height
          });
          workspace.setCoords();
          
          // Update clipping if workspace is used as clipPath
          if (canvas.clipPath === workspace) {
            console.log('Updating canvas clipPath');
            canvas.clipPath = workspace;
          }
          
          // Force workspace to be dirty for re-rendering
          workspace.set('dirty', true);
          console.log('Workspace resized successfully');
          console.log('Using found workspace bounds:', { oldBounds, newBounds });
        } else {
          // Fallback to canvas dimensions but with realistic bounds
          oldBounds = {
            width: 900, // Typical canvas size
            height: 1200,
            left: 100, // Some margin from canvas edge
            top: 100,
          };
          
          newBounds = {
            width: newSize.width,
            height: newSize.height,
            left: 100,
            top: 100,
          };

          console.log('Using fallback realistic bounds:', { oldBounds, newBounds });
        }
      } else {
        // Use workspace object
        oldBounds = {
          width: workspace.width || 0,
          height: workspace.height || 0,
          left: workspace.left || 0,
          top: workspace.top || 0,
        };

        newBounds = {
          width: newSize.width,
          height: newSize.height,
          left: workspace.left || 0,
          top: workspace.top || 0,
        };

        // Apply the new workspace size and force update
        console.log(`Resizing workspace from ${workspace.width}x${workspace.height} to ${newSize.width}x${newSize.height}`);
        workspace.set({
          width: newSize.width,
          height: newSize.height
        });
        workspace.setCoords();
        
        // Update clipping if workspace is used as clipPath
        if (canvas.clipPath === workspace) {
          console.log('Updating canvas clipPath');
          canvas.clipPath = workspace;
        }
        
        // Force workspace to be dirty for re-rendering
        workspace.set('dirty', true);
        console.log('Workspace resized successfully');
        console.log('Using workspace-based bounds:', { oldBounds, newBounds });
      }

      // Analyze current objects
      const objects = analyzeObjects(canvas);
      console.log('Objects found:', objects.length);

      // Calculate new positions based on strategy
      let positions;
      console.log('Applying strategy:', strategy);
      
      if (strategy === 'ai-powered') {
        // Use AI-powered layout engine
        console.log('Using AI-powered layout engine');
        const aiObjects = analyzeObjectsWithAI(canvas);
        const aiEngine = new AILayoutEngine();
        const aiPositions = aiEngine.generateOptimalLayout(aiObjects, oldBounds, newBounds);
        
        // Convert AI positions to standard format
        positions = aiPositions.map(pos => ({
          object: pos.object,
          left: pos.left,
          top: pos.top,
          scaleX: pos.scaleX,
          scaleY: pos.scaleY,
        }));
        
        // Log quality score
        const qualityScore = aiEngine.predictLayoutQuality(aiPositions);
        console.log('AI Layout Quality Score:', qualityScore.toFixed(2));
      } else {
        // Use traditional algorithms
        switch (strategy) {
          case 'grid-layout':
            positions = gridLayout(objects, newBounds);
            break;
          case 'smart-reflow':
            positions = smartReflowLayout(objects, newBounds);
            break;
          case 'center-focus':
            positions = centerFocusLayout(objects, newBounds);
            break;
          case 'proportional':
          default:
            positions = proportionalLayout(objects, oldBounds, newBounds);
            break;
        }
      }

      // Apply the new layout
      console.log('Applying layout with positions:', positions);
      applyLayout(positions, canvas);

      // Force canvas refresh after workspace resize
      canvas.renderAll();
      console.log('Canvas rendered after layout application');

      // Update canvas and save
      console.log('Auto-zooming and saving...');
      autoZoom();
      save();
      console.log('Smart resize completed');
    },
    [canvas, getWorkspace, autoZoom, save]
  );

  const optimizeCurrentLayout = useCallback(
    (strategy: ResizeStrategy = 'smart-reflow') => {
      if (!canvas) return;

      const workspace = getWorkspace() as fabric.Rect;
      if (!workspace) return;

      const bounds: LayoutBounds = {
        width: workspace.width || 0,
        height: workspace.height || 0,
        left: workspace.left || 0,
        top: workspace.top || 0,
      };

      let positions;
      
      if (strategy === 'ai-powered') {
        console.log('Optimizing current layout with AI');
        const aiObjects = analyzeObjectsWithAI(canvas);
        const aiEngine = new AILayoutEngine();
        const aiPositions = aiEngine.generateOptimalLayout(aiObjects, bounds, bounds);
        
        positions = aiPositions.map(pos => ({
          object: pos.object,
          left: pos.left,
          top: pos.top,
          scaleX: pos.scaleX,
          scaleY: pos.scaleY,
        }));
        
        const qualityScore = aiEngine.predictLayoutQuality(aiPositions);
        console.log('AI Optimization Quality Score:', qualityScore.toFixed(2));
      } else {
        const objects = analyzeObjects(canvas);
        
        switch (strategy) {
          case 'grid-layout':
            positions = gridLayout(objects, bounds);
            break;
          case 'center-focus':
            positions = centerFocusLayout(objects, bounds);
            break;
          case 'smart-reflow':
          default:
            positions = smartReflowLayout(objects, bounds);
            break;
        }
      }

      applyLayout(positions, canvas);
      
      // Force canvas refresh after layout changes
      canvas.renderAll();
      
      save();
    },
    [canvas, getWorkspace, save]
  );

  const previewLayout = useCallback(
    (strategy: ResizeStrategy, newSize?: { width: number; height: number }) => {
      if (!canvas) return null;

      const workspace = getWorkspace() as fabric.Rect;
      if (!workspace) return null;

      const bounds: LayoutBounds = newSize ? {
        width: newSize.width,
        height: newSize.height,
        left: workspace.left || 0,
        top: workspace.top || 0,
      } : {
        width: workspace.width || 0,
        height: workspace.height || 0,
        left: workspace.left || 0,
        top: workspace.top || 0,
      };

      const objects = analyzeObjects(canvas);

      switch (strategy) {
        case 'grid-layout':
          return gridLayout(objects, bounds);
        case 'smart-reflow':
          return smartReflowLayout(objects, bounds);
        case 'center-focus':
          return centerFocusLayout(objects, bounds);
        case 'proportional':
        default:
          const oldBounds: LayoutBounds = {
            width: workspace.width || 0,
            height: workspace.height || 0,
            left: workspace.left || 0,
            top: workspace.top || 0,
          };
          return proportionalLayout(objects, oldBounds, bounds);
      }
    },
    [canvas, getWorkspace]
  );

  const getLayoutInfo = useCallback(() => {
    if (!canvas) return null;

    const objects = analyzeObjects(canvas);
    const workspace = getWorkspace() as fabric.Rect;

    if (!workspace) return null;

    return {
      objectCount: objects.length,
      totalArea: objects.reduce((sum, obj) => sum + obj.area, 0),
      canvasArea: (workspace.width || 0) * (workspace.height || 0),
      avgObjectSize: objects.length > 0 ? objects.reduce((sum, obj) => sum + obj.area, 0) / objects.length : 0,
      bounds: {
        width: workspace.width || 0,
        height: workspace.height || 0,
        left: workspace.left || 0,
        top: workspace.top || 0,
      },
    };
  }, [canvas, getWorkspace]);

  return {
    smartResize,
    optimizeCurrentLayout,
    previewLayout,
    getLayoutInfo,
  };
};