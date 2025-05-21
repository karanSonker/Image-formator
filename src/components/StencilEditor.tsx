
import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { useAppDispatch, useAppSelector } from '../hooks';
import { resetTransformations, setOffset, setScale } from '../store/editorSlice';
import ImageUploader from './ImageUploader';
import EditorControls from './EditorControls';
import { toast } from "sonner";

// Define mask dimensions and properties
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const MASK_WIDTH = 400;
const MASK_HEIGHT = 300;
const MASK_RADIUS = 20;

const StencilEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [stencil, setStencil] = useState<fabric.Object | null>(null);
  const [image, setImage] = useState<fabric.Image | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clipPath, setClipPath] = useState<fabric.Object | null>(null);

  const imageState = useAppSelector((state) => state.editor.image);
  const transformations = useAppSelector((state) => state.editor.transformations);
  const dispatch = useAppDispatch();

  // Initialize canvas and stencil
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: '#f8f9fa',
      selection: false,
      preserveObjectStacking: true,
    });

    // Create mask/stencil (rounded rectangle)
    const mask = new fabric.Rect({
      width: MASK_WIDTH,
      height: MASK_HEIGHT,
      rx: MASK_RADIUS,
      ry: MASK_RADIUS,
      fill: 'transparent',
      stroke: '#dadada',
      strokeWidth: 2,
      left: (CANVAS_WIDTH - MASK_WIDTH) / 2,
      top: (CANVAS_HEIGHT - MASK_HEIGHT) / 2,
      selectable: false,
      evented: false,
    });

    // Create clip path (invisible) for actual clipping
    const clipPath = new fabric.Rect({
      width: MASK_WIDTH,
      height: MASK_HEIGHT,
      rx: MASK_RADIUS,
      ry: MASK_RADIUS,
      left: (CANVAS_WIDTH - MASK_WIDTH) / 2,
      top: (CANVAS_HEIGHT - MASK_HEIGHT) / 2,
      absolutePositioned: true,
    });

    fabricCanvas.add(mask);
    setCanvas(fabricCanvas);
    setStencil(mask);
    setClipPath(clipPath);

    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  // Handle image changes in Redux store - both adding and removing
  useEffect(() => {
    if (!canvas || !stencil || !clipPath) return;

    // Remove current image if it exists
    if (image) {
      canvas.remove(image);
      setImage(null);
    }

    // If there's no image URL in the Redux store, don't add a new image
    if (!imageState.url) {
      canvas.renderAll();
      return;
    }

    // Load and add the new image
    setIsLoading(true);
    fabric.Image.fromURL(
      imageState.url,
      (img) => {
        // Set clipping mask
        img.clipPath = clipPath;

        // Calculate initial scale to fit the image proportionally inside the mask
        const stencilPos = stencil.getBoundingRect();
        const scaleX = MASK_WIDTH / img.width!;
        const scaleY = MASK_HEIGHT / img.height!;
        const scale = Math.max(scaleX, scaleY);

        // Position image in the center of the mask
        img.set({
          left: stencilPos.left + MASK_WIDTH / 2,
          top: stencilPos.top + MASK_HEIGHT / 2,
          originX: 'center',
          originY: 'center',
          scaleX: scale,
          scaleY: scale,
          selectable: true,
          hasControls: false, // Disable resize controls
          hasBorders: false,
          lockRotation: true,
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        setImage(img);
        
        // Set initial transformations in Redux
        dispatch(setScale(scale));
        dispatch(setOffset({ 
          x: stencilPos.left + MASK_WIDTH / 2, 
          y: stencilPos.top + MASK_HEIGHT / 2 
        }));
        
        setIsLoading(false);
        toast.success("Image loaded successfully");

        // Setup object movement constraints
        img.on('moving', function(e) {
          const obj = e.target as fabric.Image;
          const stencilBounds = stencil.getBoundingRect();
          
          // Calculate bounds based on image dimensions and scale
          const imgWidth = obj.width! * obj.scaleX!;
          const imgHeight = obj.height! * obj.scaleY!;
          
          // Constrain movement within stencil
          const minLeft = stencilBounds.left + (imgWidth / 2);
          const maxLeft = stencilBounds.left + stencilBounds.width - (imgWidth / 2);
          const minTop = stencilBounds.top + (imgHeight / 2);
          const maxTop = stencilBounds.top + stencilBounds.height - (imgHeight / 2);
          
          if (obj.left! < minLeft) obj.set({ left: minLeft });
          if (obj.left! > maxLeft) obj.set({ left: maxLeft });
          if (obj.top! < minTop) obj.set({ top: minTop });
          if (obj.top! > maxTop) obj.set({ top: maxTop });
          
          // Update position in Redux
          dispatch(setOffset({ x: obj.left!, y: obj.top! }));
        });

        canvas.renderAll();
      },
      { crossOrigin: 'anonymous' }
    );
  }, [canvas, stencil, clipPath, imageState.url, dispatch]);

  // Apply zoom from Redux state
  useEffect(() => {
    if (!image || !canvas) return;

    image.set({
      scaleX: transformations.scale,
      scaleY: transformations.scale,
    });

    canvas.renderAll();
  }, [transformations.scale, image, canvas]);

  // Reset transformations handler
  const handleReset = () => {
    if (!image || !canvas || !stencil) return;
    
    dispatch(resetTransformations());
    
    const stencilPos = stencil.getBoundingRect();
    const scaleX = MASK_WIDTH / image.width!;
    const scaleY = MASK_HEIGHT / image.height!;
    const scale = Math.max(scaleX, scaleY);
    
    image.set({
      left: stencilPos.left + MASK_WIDTH / 2,
      top: stencilPos.top + MASK_HEIGHT / 2,
      scaleX: scale,
      scaleY: scale,
    });
    
    dispatch(setScale(scale));
    dispatch(setOffset({ 
      x: stencilPos.left + MASK_WIDTH / 2, 
      y: stencilPos.top + MASK_HEIGHT / 2 
    }));
    
    canvas.renderAll();
    toast.info("Image reset to original position");
  };

  return (
    <div className="stencil-editor p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Canvas Stencil Editor</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="canvas-container bg-white rounded-lg overflow-hidden">
              <canvas ref={canvasRef} />
            </div>
          </div>
          
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-5 rounded-lg shadow-sm">
              <h2 className="text-lg font-medium mb-4">Upload Image</h2>
              <ImageUploader />
            </div>
            
            {imageState.loaded && (
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h2 className="text-lg font-medium mb-4">Image Controls</h2>
                <EditorControls onReset={handleReset} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StencilEditor;
