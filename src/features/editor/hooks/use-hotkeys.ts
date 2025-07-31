import { fabric } from 'fabric';
import { useEvent } from 'react-use';

interface UseHotkeysProps {
  canvas: fabric.Canvas | null;
  undo: () => void;
  redo: () => void;
  save: (skip?: boolean) => void;
  copy: () => void;
  paste: () => void;
}

export const useHotkeys = ({ canvas, undo, redo, save, copy, paste }: UseHotkeysProps) => {
  useEvent('keydown', (event) => {
    const isCtrlKey = event.ctrlKey || event.metaKey;
    const isRemove = event.key === 'Backspace' || event.key === 'Delete';
    const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
    const isInput = ['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName);

    if (isInput) return;

    if (isRemove) {
      canvas?.remove(...canvas.getActiveObjects());
      canvas?.discardActiveObject();
    }

    // Arrow key movement for selected objects
    if (isArrowKey && canvas) {
      event.preventDefault();
      const activeObjects = canvas.getActiveObjects();
      
      if (activeObjects.length > 0) {
        // Movement distance (in pixels)
        const moveDistance = event.shiftKey ? 10 : 1; // Hold Shift for faster movement
        
        activeObjects.forEach((obj) => {
          const currentLeft = obj.left || 0;
          const currentTop = obj.top || 0;
          
          switch (event.key) {
            case 'ArrowUp':
              obj.set({ top: currentTop - moveDistance });
              break;
            case 'ArrowDown':
              obj.set({ top: currentTop + moveDistance });
              break;
            case 'ArrowLeft':
              obj.set({ left: currentLeft - moveDistance });
              break;
            case 'ArrowRight':
              obj.set({ left: currentLeft + moveDistance });
              break;
          }
          
          obj.setCoords(); // Update object coordinates for proper selection
        });
        
        canvas.renderAll(); // Re-render the canvas
      }
    }

    if (isCtrlKey && (event.key === 'z' || event.key === 'Z')) {
      event.preventDefault();
      undo();
    }

    if (isCtrlKey && (event.key === 'y' || event.key === 'Y')) {
      event.preventDefault();
      redo();
    }

    if (isCtrlKey && (event.key === 'c' || event.key === 'C')) {
      event.preventDefault();
      copy();
    }

    if (isCtrlKey && (event.key === 'v' || event.key === 'V')) {
      event.preventDefault();
      paste();
    }

    if (isCtrlKey && (event.key === 's' || event.key === 'S')) {
      event.preventDefault();
      save(true);
    }

    if (isCtrlKey && (event.key === 'a' || event.key === 'A')) {
      event.preventDefault();
      canvas?.discardActiveObject();

      const allObjects = canvas?.getObjects().filter((object) => object.selectable);

      canvas?.setActiveObject(new fabric.ActiveSelection(allObjects, { canvas }));
      canvas?.renderAll();
    }
  });
};
