
import { useRef } from 'react';
import { useAppDispatch } from '../hooks';
import { setImage, resetImage } from '../store/editorSlice';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";

const ImageUploader = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      dispatch(setImage({ file, url }));
    };
    
    reader.onerror = () => {
      toast.error('Error reading the image file');
    };
    
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    dispatch(resetImage());
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.info('Image removed');
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <div className="flex flex-col gap-2">
        <Button 
          onClick={handleUploadClick} 
          className="w-full bg-[hsl(var(--editor-accent))] hover:bg-[hsl(var(--editor-accent-hover))]"
        >
          Upload Image
        </Button>
        <Button 
          onClick={handleReset} 
          variant="outline" 
          className="w-full"
        >
          Remove Image
        </Button>
      </div>
      <div className="text-sm text-muted-foreground mt-2">
        Recommended: JPG, PNG with transparent background
      </div>
    </div>
  );
};

export default ImageUploader;
