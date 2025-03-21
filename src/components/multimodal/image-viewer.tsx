import { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Download, Pencil, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { UploadedFile } from './file-upload';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';

interface ImageViewerProps {
  file: UploadedFile;
  onClose?: () => void;
  onSave?: (file: UploadedFile) => void;
  editable?: boolean;
}

export function ImageViewer({
  file,
  onClose,
  onSave,
  editable = false,
}: ImageViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (!file || !file.preview) return;

    const canvasElement = document.createElement('canvas');
    setCanvas(canvasElement);

    const img = new Image();
    img.onload = () => {
      if (!canvasElement) return;
      
      canvasElement.width = img.width;
      canvasElement.height = img.height;
      
      const ctx = canvasElement.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        setImageLoaded(true);
      }
    };
    img.src = file.preview;

    return () => {
      setCanvas(null);
      setImageLoaded(false);
    };
  }, [file]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
    
    // Need to rotate the canvas when in edit mode
    if (isEditMode && canvas) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const img = new Image();
      img.onload = () => {
        if (!canvas) return;
        
        // Swap width and height
        const temp = canvas.width;
        canvas.width = canvas.height;
        canvas.height = temp;
        
        // Translate and rotate context
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((90 * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        
        // Reset transformation
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      };
      
      // Create temporary data URL for the current canvas state
      img.src = canvas.toDataURL();
    }
  };

  const handleDownload = () => {
    if (!file.preview) return;
    
    const link = document.createElement('a');
    link.href = isEditMode && canvas ? canvas.toDataURL() : file.preview;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Image downloaded",
      description: `${file.name} has been downloaded successfully.`,
    });
  };

  const toggleEditMode = () => {
    if (!editable) return;
    
    if (!isEditMode) {
      setIsEditMode(true);
    } else {
      setIsEditMode(false);
    }
  };

  const handleSave = () => {
    if (!canvas || !onSave) return;
    
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        
        // Create a new file from the blob
        const newFile = new File([blob], file.name, { type: file.type });
        
        // Create a new preview URL
        const newPreview = URL.createObjectURL(blob);
        
        // Revoke old preview URL to prevent memory leaks
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
        
        // Create updated file object
        const updatedFile: UploadedFile = {
          ...file,
          file: newFile,
          preview: newPreview,
          size: blob.size,
        };
        
        onSave(updatedFile);
        setIsEditMode(false);
        
        toast({
          title: "Image saved",
          description: "Your changes have been saved successfully.",
        });
      },
      file.type,
      1
    );
  };

  const renderImageContent = () => {
    if (!file.preview) {
      return <div className="flex items-center justify-center h-64 bg-muted">Image preview not available</div>;
    }

    if (isEditMode && canvas) {
      return (
        <div className="flex justify-center overflow-hidden bg-muted/30 dark:bg-muted/10 p-4 h-64">
          <canvas 
            ref={(el) => {
              if (el && canvas && imageLoaded) {
                const ctx = el.getContext('2d');
                if (ctx) {
                  el.width = canvas.width;
                  el.height = canvas.height;
                  ctx.drawImage(canvas, 0, 0);
                }
              }
            }}
            className="max-h-full object-contain"
            style={{
              transform: `scale(${zoom})`,
            }}
          />
        </div>
      );
    }

    return (
      <div className="flex justify-center overflow-hidden bg-muted/30 dark:bg-muted/10 p-4 h-64">
        <img
          src={file.preview}
          alt={file.name}
          className="max-h-full object-contain"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transition: 'transform 0.2s ease-in-out',
          }}
        />
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardContent className="p-0 relative">
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {renderImageContent()}
      </CardContent>
      <CardFooter className="flex justify-between p-2 gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom Out</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Slider 
            value={[zoom * 100]} 
            min={50} 
            max={300} 
            step={10}
            className="w-20 mx-2"
            onValueChange={(value) => setZoom(value[0] / 100)}
          />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom In</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleRotate}>
                  <RotateCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rotate</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {editable && (
            <>
              {isEditMode ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={handleSave}>
                        <Save className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Save Changes</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={toggleEditMode}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit Image</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
