import { useState } from 'react';
import { FileCog, FileText, Clock, CheckCircle2, Download, Share2, Printer, Copy, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AutoTask } from './autonomous-task-runner';

export interface TaskResultFile {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: Date;
  url?: string;
}

export interface TaskReport {
  task: AutoTask;
  summary: string;
  executionTime: number;  // in seconds
  completedAt: Date;
  results: {
    success: boolean;
    message: string;
    details: string;
  };
  files: TaskResultFile[];
  logs: string[];
}

interface TaskReportProps {
  report: TaskReport;
  onDownload?: (fileId: string) => void;
  onShare?: () => void;
  onExport?: (format: 'pdf' | 'html' | 'markdown') => void;
}

export function TaskReport({
  report,
  onDownload,
  onShare,
  onExport,
}: TaskReportProps) {
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const handleDownload = (fileId: string) => {
    if (onDownload) {
      onDownload(fileId);
    } else {
      toast({
        title: "Download Started",
        description: "File download has started.",
      });
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      toast({
        title: "Sharing Task Report",
        description: "Opening share options...",
      });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/tasks/${report.task.id}`);
    toast({
      title: "Link Copied",
      description: "Task report link has been copied to clipboard.",
    });
  };

  const handleExport = (format: 'pdf' | 'html' | 'markdown') => {
    if (onExport) {
      onExport(format);
    } else {
      toast({
        title: `Exporting as ${format.toUpperCase()}`,
        description: "Your export will begin shortly.",
      });
    }
  };

  const handlePrint = () => {
    window.print();
    toast({
      title: "Printing",
      description: "Sending report to printer...",
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  };

  const getSelectedFile = () => {
    return report.files.find(file => file.id === selectedFileId);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('audio/')) return '🔊';
    if (fileType.startsWith('video/')) return '🎬';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('presentation')) return '📊';
    if (fileType.includes('document')) return '📝';
    return '📄';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{report.task.title} - Results</CardTitle>
            <CardDescription className="mt-1">
              Completed on {report.completedAt.toLocaleString()} • 
              Execution time: {formatTime(report.executionTime)}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary">
            <div className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {report.results.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <FileCog className="h-5 w-5 text-amber-500" />
                  )}
                  <h3 className="text-md font-medium">Task Result</h3>
                </div>
                <p className="text-sm mb-4">
                  {report.results.message}
                </p>
                <p className="text-sm text-muted-foreground">
                  {report.summary}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-sm font-medium">Files Generated</h3>
                  </div>
                  <p className="text-xl font-semibold">{report.files.length}</p>
                </div>
                
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-sm font-medium">Time Saved</h3>
                  </div>
                  <p className="text-xl font-semibold">{formatTime(report.executionTime * 3)}</p>
                </div>
              </div>
              
              {report.files.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Top Files</h3>
                  <div className="space-y-2">
                    {report.files.slice(0, 3).map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 bg-background border rounded-md">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getFileIcon(file.type)}</span>
                          <div>
                            <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0" 
                          onClick={() => handleDownload(file.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="files">
            <div className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-3">Generated Files ({report.files.length})</h3>
                
                {report.files.length > 0 ? (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {report.files.map((file) => (
                        <div 
                          key={file.id} 
                          className={`flex items-center justify-between p-3 rounded-md cursor-pointer ${
                            selectedFileId === file.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'
                          }`}
                          onClick={() => setSelectedFileId(file.id)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{getFileIcon(file.type)}</span>
                            <div>
                              <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatSize(file.size)} • {file.createdAt.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(file.id);
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            
                            {file.url && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                                  <DialogHeader>
                                    <DialogTitle>{file.name}</DialogTitle>
                                    <DialogDescription>
                                      {formatSize(file.size)} • {file.createdAt.toLocaleString()}
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <div className="mt-4">
                                    {file.type.startsWith('image/') ? (
                                      <img 
                                        src={file.url} 
                                        alt={file.name}
                                        className="max-w-full max-h-[60vh] object-contain mx-auto"
                                      />
                                    ) : file.type.includes('pdf') ? (
                                      <iframe 
                                        src={file.url}
                                        className="w-full h-[60vh]"
                                        title={file.name}
                                      />
                                    ) : (
                                      <div className="flex items-center justify-center p-12 bg-muted/30">
                                        <p>Preview not available for this file type</p>
                                      </div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex items-center justify-center p-8 bg-muted/10 rounded-md">
                    <p className="text-muted-foreground">No files were generated during this task</p>
                  </div>
                )}
              </div>
              
              {selectedFileId && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="text-sm font-medium mb-3">File Preview</h3>
                  
                  {getSelectedFile()?.url ? (
                    <div className="bg-background p-4 rounded-md text-center">
                      {getSelectedFile()?.type.startsWith('image/') ? (
                        <img 
                          src={getSelectedFile()?.url} 
                          alt={getSelectedFile()?.name}
                          className="max-w-full max-h-[200px] object-contain mx-auto"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                          <span className="text-4xl mb-2">{getFileIcon(getSelectedFile()?.type || '')}</span>
                          <p className="text-sm">{getSelectedFile()?.name}</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-4"
                            onClick={() => handleDownload(selectedFileId)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download File
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-8 bg-background rounded-md">
                      <p className="text-muted-foreground">Preview not available for this file</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="details">
            <div className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-3">Task Details</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Task ID</p>
                      <p className="font-medium">{report.task.id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-medium">{report.task.createdAt.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Completed</p>
                      <p className="font-medium">{report.completedAt.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Execution Time</p>
                      <p className="font-medium">{formatTime(report.executionTime)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-3">Task Steps</h3>
                
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {report.task.steps.map((step, index) => (
                      <div key={step.id} className="bg-background p-3 rounded-md">
                        <div className="flex items-start gap-2">
                          <div className={`mt-0.5 rounded-full w-5 h-5 flex items-center justify-center text-xs
                            ${step.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                              step.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                              'bg-muted text-muted-foreground'}`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{step.description}</p>
                            {step.result && (
                              <p className="text-xs text-muted-foreground mt-1">{step.result}</p>
                            )}
                            {step.error && (
                              <p className="text-xs text-red-500 mt-1">{step.error}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-3">Detailed Results</h3>
                <p className="text-sm whitespace-pre-wrap">{report.results.details}</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="logs">
            <div className="space-y-4">
              <div className="bg-background border rounded-md p-1">
                <ScrollArea className="h-[400px]">
                  <div className="p-3 font-mono text-xs">
                    {report.logs.length > 0 ? (
                      report.logs.map((log, index) => (
                        <div key={index} className="py-1">
                          {log}
                        </div>
                      ))
                    ) : (
                      <div className="text-muted-foreground">No logs available for this task.</div>
                    )}
                  </div>
                </ScrollArea>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const logText = report.logs.join('\n');
                    navigator.clipboard.writeText(logText);
                    toast({
                      title: "Logs Copied",
                      description: "Task logs have been copied to clipboard.",
                    });
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Logs
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="pt-2 flex justify-between flex-wrap">
        <Button variant="outline" size="sm" onClick={handleCopyLink}>
          <Copy className="h-4 w-4 mr-2" />
          Copy Link
        </Button>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Export Report</DialogTitle>
                <DialogDescription>
                  Choose a format to export this task report
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-4 py-4">
                <Button variant="outline" onClick={() => handleExport('pdf')}>
                  PDF
                </Button>
                <Button variant="outline" onClick={() => handleExport('html')}>
                  HTML
                </Button>
                <Button variant="outline" onClick={() => handleExport('markdown')}>
                  Markdown
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardFooter>
    </Card>
  );
}
