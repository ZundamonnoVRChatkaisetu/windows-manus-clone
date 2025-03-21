import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import { UploadedFile } from './file-upload';

interface DocumentViewerProps {
  file: UploadedFile;
  onClose?: () => void;
}

export function DocumentViewer({
  file,
  onClose,
}: DocumentViewerProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (!file || file.uploadType !== 'document') {
      setError('Invalid document file');
      setLoading(false);
      return;
    }

    const loadDocument = async () => {
      setLoading(true);
      setError(null);

      try {
        // Simple text handling for common text files
        if (file.type.startsWith('text/') || 
            file.type === 'application/json' || 
            file.name.endsWith('.md') || 
            file.name.endsWith('.txt') || 
            file.name.endsWith('.json')) {
          
          const text = await file.file.text();
          setContent(text);
          setTotalPages(1);
        }
        // PDF handling - simplified for this implementation
        else if (file.type === 'application/pdf') {
          // In a real implementation, we would use PDF.js here
          // For this simplified version, we'll just show a placeholder
          setContent(`PDF Viewer would go here for: ${file.name}`);
          setTotalPages(5); // Example value
        }
        // Office documents - simplified for this implementation
        else if (file.type.includes('document') || 
                file.type.includes('spreadsheet') || 
                file.type.includes('presentation')) {
          
          setContent(`Office document viewer would go here for: ${file.name}`);
          setTotalPages(10); // Example value
        }
        else {
          // For other document types, show a simple message
          setContent(`Document preview not available for this file type: ${file.type}`);
          setTotalPages(1);
        }
      } catch (err) {
        console.error('Error loading document:', err);
        setError('Failed to load document. The file might be corrupted or in an unsupported format.');
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [file]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = () => {
    if (!file) return;
    
    const url = URL.createObjectURL(file.file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Document Downloaded',
      description: `${file.name} has been downloaded successfully.`,
    });
  };

  const handleSearch = () => {
    if (!searchText.trim()) return;
    
    // In a real implementation, this would search the document
    toast({
      title: 'Search',
      description: `Searching for: ${searchText}`,
    });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-[400px]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex justify-center items-center h-[400px] text-destructive">
          <p>{error}</p>
        </div>
      );
    }

    // For text content, we render it directly with proper formatting
    if (file.type.startsWith('text/') || 
        file.type === 'application/json' || 
        file.name.endsWith('.md') || 
        file.name.endsWith('.txt') || 
        file.name.endsWith('.json')) {
      
      return (
        <div 
          className="whitespace-pre-wrap overflow-auto h-[400px] p-4 font-mono text-sm bg-muted/30"
          style={{ 
            fontSize: `${Math.max(12, 12 * zoom)}px`,
          }}
        >
          {content}
        </div>
      );
    }

    // For other document types (PDF, Office, etc.), we'd show a rendered preview
    // This is a simplified placeholder
    return (
      <div 
        className="flex justify-center items-center h-[400px] bg-muted/30 overflow-auto"
      >
        <div 
          className="bg-background p-8 shadow rounded-lg max-w-[80%] text-center"
          style={{ 
            transform: `scale(${zoom})`,
            transformOrigin: 'center',
            transition: 'transform 0.2s ease-in-out'
          }}
        >
          <p className="text-lg font-semibold mb-2">
            {file.name}
          </p>
          <p className="text-muted-foreground mb-4">
            Page {currentPage} of {totalPages}
          </p>
          <p>{content}</p>
        </div>
      </div>
    );
  };

  // Function to determine if pagination should be shown
  const shouldShowPagination = () => {
    return totalPages > 1;
  };

  return (
    <Card className="w-full">
      <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
        <CardTitle className="text-lg truncate">
          {file.name}
        </CardTitle>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="ml-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        {renderContent()}
      </CardContent>
      
      <CardFooter className="p-4 pt-2 flex flex-wrap gap-2">
        <div className="flex items-center gap-1 mr-auto">
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
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-2">
            <Input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-32 h-8"
            />
            <Button 
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleSearch}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          {shouldShowPagination() && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-xs">
                {currentPage} / {totalPages}
              </span>
              
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          
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
        </div>
      </CardFooter>
    </Card>
  );
}
