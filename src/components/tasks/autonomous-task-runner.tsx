import { useState, useEffect } from 'react';
import { Play, PauseCircle, AlertCircle, CheckCircle2, RefreshCw, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// Types for our task runner
export interface AutoTaskStep {
  id: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  result?: string;
  error?: string;
}

export interface AutoTask {
  id: string;
  title: string;
  description: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  progress: number;
  steps: AutoTaskStep[];
  result?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AutoTaskRunnerProps {
  task: AutoTask;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onRetry?: (stepId?: string) => void;
  onViewReport?: () => void;
  isConnected?: boolean;
}

export function AutoTaskRunner({
  task,
  onStart,
  onPause,
  onResume,
  onStop,
  onRetry,
  onViewReport,
  isConnected = true,
}: AutoTaskRunnerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Status colors
  const getStatusColor = (status: AutoTask['status'] | AutoTaskStep['status']) => {
    switch (status) {
      case 'running':
        return 'text-blue-500 animate-pulse';
      case 'completed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      case 'paused':
        return 'text-amber-500';
      default:
        return 'text-muted-foreground';
    }
  };

  // Status badges
  const getStatusBadge = (status: AutoTask['status']) => {
    switch (status) {
      case 'running':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Running</Badge>;
      case 'paused':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Paused</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Failed</Badge>;
      default:
        return <Badge variant="outline">Ready</Badge>;
    }
  };

  // Get the status icon
  const getStatusIcon = (status: AutoTaskStep['status']) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <ClipboardList className="h-4 w-4" />;
    }
  };

  // Handle task actions
  const handleStart = () => {
    if (!isConnected) {
      toast({
        title: "Connection Error",
        description: "Cannot start task because you are offline.",
        variant: "destructive",
      });
      return;
    }
    
    if (onStart) onStart();
    
    toast({
      title: "Task Started",
      description: `Autonomous execution of "${task.title}" has begun.`,
    });
  };

  const handlePause = () => {
    if (onPause) onPause();
    
    toast({
      title: "Task Paused",
      description: "You can resume execution at any time.",
    });
  };

  const handleResume = () => {
    if (!isConnected) {
      toast({
        title: "Connection Error",
        description: "Cannot resume task because you are offline.",
        variant: "destructive",
      });
      return;
    }
    
    if (onResume) onResume();
    
    toast({
      title: "Task Resumed",
      description: "Continuing from where we left off.",
    });
  };

  const handleStop = () => {
    if (onStop) onStop();
    
    toast({
      title: "Task Stopped",
      description: "The task has been stopped. You can retry from the beginning.",
    });
  };

  const handleRetry = (stepId?: string) => {
    if (!isConnected) {
      toast({
        title: "Connection Error",
        description: "Cannot retry task because you are offline.",
        variant: "destructive",
      });
      return;
    }
    
    if (onRetry) onRetry(stepId);
    
    toast({
      title: stepId ? "Step Retrying" : "Task Retrying",
      description: stepId 
        ? "Retrying this specific step." 
        : "Retrying the entire task from the beginning.",
    });
  };

  const handleViewReport = () => {
    if (onViewReport) onViewReport();
  };

  // Format the time elapsed
  const formatTimeElapsed = () => {
    const elapsed = new Date().getTime() - task.createdAt.getTime();
    const seconds = Math.floor(elapsed / 1000) % 60;
    const minutes = Math.floor(elapsed / (1000 * 60)) % 60;
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{task.title}</CardTitle>
            <CardDescription className="line-clamp-2">{task.description}</CardDescription>
          </div>
          {getStatusBadge(task.status)}
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>Progress: {task.progress}%</span>
              <span className={isConnected ? "text-green-500" : "text-red-500"}>
                {isConnected ? "Connected" : "Offline"}
              </span>
            </div>
            <Progress value={task.progress} className="h-2" />
          </div>
          
          {isExpanded && (
            <div className="space-y-2 pt-2">
              <h4 className="text-sm font-medium">Task Steps</h4>
              <ScrollArea className="h-[200px] rounded-md border p-2">
                <div className="space-y-2">
                  {task.steps.map((step) => (
                    <div key={step.id} className="space-y-1">
                      <div className="flex items-start gap-2">
                        <div className={`mt-0.5 ${getStatusColor(step.status)}`}>
                          {getStatusIcon(step.status)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{step.description}</p>
                          {step.status === 'running' && step.progress !== undefined && (
                            <Progress value={step.progress} className="h-1 mt-1" />
                          )}
                          {step.result && step.status === 'completed' && (
                            <p className="text-xs text-muted-foreground mt-1">{step.result}</p>
                          )}
                          {step.error && step.status === 'failed' && (
                            <p className="text-xs text-red-500 mt-1">{step.error}</p>
                          )}
                        </div>
                        {step.status === 'failed' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-xs"
                            onClick={() => handleRetry(step.id)}
                          >
                            Retry
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
          
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Created: {task.createdAt.toLocaleString()}</span>
            {task.status === 'running' && (
              <span>Running for: {formatTimeElapsed()}</span>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 flex justify-between flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Hide Details" : "Show Details"}
        </Button>
        
        <div className="flex gap-2">
          {task.status === 'idle' && (
            <Button size="sm" onClick={handleStart}>
              <Play className="h-4 w-4 mr-1" /> Start
            </Button>
          )}
          
          {task.status === 'running' && (
            <Button variant="outline" size="sm" onClick={handlePause}>
              <PauseCircle className="h-4 w-4 mr-1" /> Pause
            </Button>
          )}
          
          {task.status === 'paused' && (
            <Button size="sm" onClick={handleResume}>
              <Play className="h-4 w-4 mr-1" /> Resume
            </Button>
          )}
          
          {(task.status === 'running' || task.status === 'paused') && (
            <Button variant="outline" size="sm" onClick={handleStop}>
              Stop
            </Button>
          )}
          
          {task.status === 'failed' && (
            <Button size="sm" onClick={() => handleRetry()}>
              <RefreshCw className="h-4 w-4 mr-1" /> Retry
            </Button>
          )}
          
          {task.status === 'completed' && (
            <Button size="sm" onClick={handleViewReport}>
              <ClipboardList className="h-4 w-4 mr-1" /> View Report
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
