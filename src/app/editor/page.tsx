'use client';

import { fabric } from 'fabric';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { useEditor } from '@/features/editor/hooks/use-editor';
import { type ActiveTool, selectionDependentTools } from '@/features/editor/types';

import { AdobeAISidebar } from '@/features/editor/components/adobe-ai-sidebar';
import { DrawSidebar } from '@/features/editor/components/draw-sidebar';
import { FillColorSidebar } from '@/features/editor/components/fill-color-sidebar';
import { FilterSidebar } from '@/features/editor/components/filter-sidebar';
import { FontSidebar } from '@/features/editor/components/font-sidebar';
import { Footer } from '@/features/editor/components/footer';
import { ImageSidebar } from '@/features/editor/components/image-sidebar';
import { Navbar } from '@/features/editor/components/navbar';
import { CpaButtonSidebar } from '@/features/editor/components/cpa-button-sidebar';
import { RemoveBgSidebar } from '@/features/editor/components/remove-bg-sidebar';
import { ResizeSidebar } from '@/features/editor/components/resize-sidebar';
import { ShapeSidebar } from '@/features/editor/components/shape-sidebar';
import { Sidebar } from '@/features/editor/components/sidebar';
import { StrokeColorSidebar } from '@/features/editor/components/stroke-color-sidebar';
import { OpacitySidebar } from '@/features/editor/components/stroke-opacity-sidebar';
import { StrokeWidthSidebar } from '@/features/editor/components/stroke-width-sidebar';
import { TemplateSidebar } from '@/features/editor/components/template-sidebar';
import { TextSidebar } from '@/features/editor/components/text-sidebar';
import { Toolbar } from '@/features/editor/components/toolbar';
import { CanvasSizeSelector } from '@/components/ui/canvas-size-selector';

// Function to create demo project data with custom canvas size
const createDemoProject = (width: number, height: number) => ({
  id: 'demo',
  name: 'Demo Project',
  json: `{"version":"5.3.0","objects":[{"type":"rect","version":"5.3.0","originX":"left","originY":"top","left":0,"top":0,"width":${width},"height":${height},"fill":"white","stroke":null,"strokeWidth":0,"strokeDashArray":null,"strokeLineCap":"butt","strokeDashOffset":0,"strokeLineJoin":"miter","strokeUniform":false,"strokeMiterLimit":4,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"backgroundColor":"","fillRule":"nonzero","paintFirst":"fill","globalCompositeOperation":"source-over","skewX":0,"skewY":0,"name":"clip","selectable":false,"evented":false}],"backgroundImage":null,"background":"white","overlayImage":null,"clipPath":null}`,
  width,
  height,
  thumbnailUrl: null,
  isTemplate: false,
  userId: 'demo',
  createdAt: new Date(),
  updatedAt: new Date(),
});

const DemoPage = () => {
  const [activeTool, setActiveTool] = useState<ActiveTool>('select');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Get canvas size from URL parameters with error handling (fallback)
  const searchParams = useSearchParams();
  
  // Initialize canvas size from URL params immediately, with fallback
  const initialCanvasSize = useMemo(() => {
    try {
      const widthParam = searchParams.get('width');
      const heightParam = searchParams.get('height');
      
      if (widthParam && heightParam) {
        const width = Number(widthParam);
        const height = Number(heightParam);
        
        if (width > 0 && height > 0) {
          console.log('Initializing with URL params:', { width, height });
          return { width, height };
        }
      }
    } catch (error) {
      console.warn('Error parsing URL parameters:', error);
    }
    
    // Fallback to default size
    console.log('Using default canvas size');
    return { width: 400, height: 400 };
  }, [searchParams]);
  
  const [canvasSize, setCanvasSize] = useState(initialCanvasSize);
  const [showSizeSelector, setShowSizeSelector] = useState(!searchParams.get('width') || !searchParams.get('height'));
  

  const handleSizeSelect = (width: number, height: number) => {
    setCanvasSize({ width, height });
    setShowSizeSelector(false);
    
    // Update URL to reflect the chosen size
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('width', width.toString());
    newUrl.searchParams.set('height', height.toString());
    window.history.replaceState({}, '', newUrl.toString());
  };

  const width = canvasSize.width;
  const height = canvasSize.height;
  
  // Create demo project with custom size
  const demoProject = useMemo(() => {
    console.log('Creating demo project with dimensions:', { width, height });
    return createDemoProject(width, height);
  }, [width, height]);

  // Demo save function - saves to localStorage and shows success
  const demoSave = useCallback((values: { json: string; height: number; width: number }) => {
    try {
      // Save to localStorage with timestamp
      const savedProject = {
        ...demoProject,
        json: values.json,
        width: values.width,
        height: values.height,
        updatedAt: new Date().toISOString(),
        lastSaved: new Date().toLocaleString(),
      };
      
      localStorage.setItem('demo-project', JSON.stringify(savedProject));
      
      // Show success notification
      console.log('✅ Demo project saved successfully:', values);
      
      // Only show alert for manual saves (not automatic initialization)
      // This prevents the popup from appearing when the page first loads
      
      return Promise.resolve();
    } catch (error) {
      console.error('❌ Failed to save demo project:', error);
      if (window.alert) {
        window.alert('❌ Failed to save project. Please try again.');
      }
      return Promise.reject(error);
    }
  }, []);

  const onClearSelection = useCallback(() => {
    if (selectionDependentTools.includes(activeTool)) {
      setActiveTool('select');
    }
  }, [activeTool]);

  const { init, editor } = useEditor({
    defaultState: demoProject.json,
    defaultWidth: demoProject.width,
    defaultHeight: demoProject.height,
    clearSelectionCallback: onClearSelection,
    saveCallback: demoSave,
  });
  
  // Debug log when editor receives new dimensions
  console.log('Editor initialized with:', {
    width: demoProject.width,
    height: demoProject.height,
    canvasSize,
    showSizeSelector
  });

  const onChangeActiveTool = useCallback(
    (tool: ActiveTool) => {
      if (tool === 'draw') {
        editor?.enableDrawingMode();
      }

      if (activeTool === 'draw') {
        editor?.disableDrawingMode();
      }

      if (tool === activeTool) {
        return setActiveTool('select');
      }

      setActiveTool(tool);
    },
    [activeTool, editor],
  );

  useEffect(() => {
    // Only initialize canvas when size is selected (not showing selector)
    if (showSizeSelector || !canvasRef.current || !containerRef.current) {
      return;
    }

    const canvas = new fabric.Canvas(canvasRef.current, {
      controlsAboveOverlay: true,
      preserveObjectStacking: true,
    });

    init({
      initialCanvas: canvas,
      initialContainer: containerRef.current,
    });

    return () => {
      canvas.dispose();
    };
  }, [init, showSizeSelector]);

  return (
    <div className="flex h-full flex-col">
      {/* Size Selector Modal - shown at the beginning */}
      {showSizeSelector && (
        <CanvasSizeSelector onSizeSelect={handleSizeSelect} />
      )}

      <Navbar
        id={demoProject.id}
        title={`${demoProject.name} (${width}×${height})`}
        editor={editor}
        activeTool={activeTool}
        onChangeActiveTool={onChangeActiveTool}
      />

      <div className="absolute top-[68px] bottom-0 left-0 z-[49] flex w-[100px] flex-col border-r bg-white">
        <Sidebar activeTool={activeTool} onChangeActiveTool={onChangeActiveTool} />
      </div>

      <main className="relative flex flex-1 bg-gray-900 pl-[100px]">
        <div className="flex h-full flex-1 flex-col overflow-auto relative">
          <Toolbar
            editor={editor}
            activeTool={activeTool}
            onChangeActiveTool={onChangeActiveTool}
            key={JSON.stringify(editor?.canvas.getActiveObject())}
          />

          <div className="flex-1 h-[calc(100%-124px)] bg-gray-900 flex items-center justify-center" ref={containerRef}>
            <canvas ref={canvasRef} style={{ border: '2px solid #444' }} />
          </div>

          <Footer editor={editor} />
        </div>


        <FillColorSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />

        <StrokeColorSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />

        <StrokeWidthSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />

        <OpacitySidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />

        <FontSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />

        <FilterSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />

        <ResizeSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />

        <ShapeSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />

        <TextSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />

        <DrawSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />

        <ImageSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />

        <TemplateSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />

        <RemoveBgSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />

        <CpaButtonSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />

        <AdobeAISidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
      </main>
    </div>
  );
};

export default DemoPage;