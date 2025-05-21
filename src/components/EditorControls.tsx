
import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { setScale } from '../store/editorSlice';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from "sonner";
import { ZoomIn, ZoomOut } from 'lucide-react';

interface EditorControlsProps {
  onReset: () => void;
}

const EditorControls = ({ onReset }: EditorControlsProps) => {
  const transformations = useAppSelector((state) => state.editor.transformations);
  const dispatch = useAppDispatch();
  const [zoomValue, setZoomValue] = useState(transformations.scale);

  // Min and max zoom scale limits
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 2.0;
  const ZOOM_STEP = 0.1;

  const handleZoomChange = (value: number[]) => {
    const newZoom = value[0];
    setZoomValue(newZoom);
    dispatch(setScale(newZoom));
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoomValue + ZOOM_STEP, MAX_ZOOM);
    setZoomValue(newZoom);
    dispatch(setScale(newZoom));
    toast.info(`Zoom: ${Math.round(newZoom * 100)}%`);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomValue - ZOOM_STEP, MIN_ZOOM);
    setZoomValue(newZoom);
    dispatch(setScale(newZoom));
    toast.info(`Zoom: ${Math.round(newZoom * 100)}%`);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Zoom</span>
          <span className="text-sm text-muted-foreground">
            {Math.round(zoomValue * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline" 
            size="icon"
            onClick={handleZoomOut}
            disabled={zoomValue <= MIN_ZOOM}
            className="h-8 w-8"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <Slider
            value={[zoomValue]}
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={ZOOM_STEP}
            onValueChange={handleZoomChange}
            className="flex-1"
          />

          <Button
            variant="outline" 
            size="icon"
            onClick={handleZoomIn}
            disabled={zoomValue >= MAX_ZOOM}
            className="h-8 w-8"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="pt-4 border-t">
        <Button 
          onClick={onReset} 
          variant="secondary" 
          className="w-full"
        >
          Reset Position
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">
        <p className="mb-1">Tip: Drag the image to position it within the frame.</p>
        <p>Use the slider or buttons to zoom in and out.</p>
      </div>
    </div>
  );
};

export default EditorControls;
