import React, { useState } from 'react';
import { Timer, BarChart3, Clock, Cpu, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AutoTask } from './autonomous-task-runner';

export interface TaskPerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  estimatedTimeRemaining: number; // in seconds
  executionSpeed: number; // percentage of benchmark
  errorCount: number;
  completedSteps: number;
  totalSteps: number;
}

interface ProgressVisualizerProps {
  task: AutoTask;
  metrics?: TaskPerformanceMetrics;
}

export function ProgressVisualizer({ task, metrics }: ProgressVisualizerProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Default metrics if none provided
  const defaultMetrics: TaskPerformanceMetrics = {
    cpuUsage: 35,
    memoryUsage: 42,
    estimatedTimeRemaining: 180, // 3 minutes
    executionSpeed: 94,
    errorCount: 0,
    completedSteps: task.steps.filter(step => step.status === 'completed').length,
    totalSteps: task.steps.length,
  };

  const taskMetrics = metrics || defaultMetrics;

  const formatTimeRemaining = (seconds: number) => {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  // Calculate overall progress status
  const calculateOverallStatus = () => {
    if (task.status === 'failed') return 'error';
    if (task.status === 'completed') return 'success';
    
    // Check if any step has failed
    const hasFailedSteps = task.steps.some(step => step.status === 'failed');
    if (hasFailedSteps) return 'warning';
    
    return 'normal';
  };

  const overallStatus = calculateOverallStatus();

  const getStatusColor = (status: 'normal' | 'warning' | 'error' | 'success') => {
    switch (status) {
      case 'normal':
        return 'text-blue-500';
      case 'warning':
        return 'text-amber-500';
      case 'error':
        return 'text-red-500';
      case 'success':
        return 'text-green-500';
    }
  };

  const getStatusIcon = (status: 'normal' | 'warning' | 'error' | 'success') => {
    switch (status) {
      case 'normal':
        return <Timer className="h-5 w-5" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5" />;
      case 'error':
        return <AlertCircle className="h-5 w-5" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5" />;
    }
  };

  // Progress bar color based on status
  const getProgressColor = (status: 'normal' | 'warning' | 'error' | 'success') => {
    switch (status) {
      case 'normal':
        return '';
      case 'warning':
        return 'bg-amber-500';
      case 'error':
        return 'bg-red-500';
      case 'success':
        return 'bg-green-500';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Task Progress</CardTitle>
        <CardDescription>
          Visualizing execution of "{task.title}"
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Overall Progress ({task.progress}%)
                  </span>
                  <span className={`flex items-center gap-1 ${getStatusColor(overallStatus)}`}>
                    {getStatusIcon(overallStatus)}
                    <span className="text-sm">
                      {overallStatus === 'normal' ? 'In Progress' :
                       overallStatus === 'warning' ? 'Issues Detected' :
                       overallStatus === 'error' ? 'Failed' : 'Completed'}
                    </span>
                  </span>
                </div>
                <Progress 
                  value={task.progress} 
                  className={`h-2 ${getProgressColor(overallStatus)}`} 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/40 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Time Remaining</span>
                  </div>
                  <p className="text-lg font-semibold">{formatTimeRemaining(taskMetrics.estimatedTimeRemaining)}</p>
                </div>
                
                <div className="bg-muted/40 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Completion</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {taskMetrics.completedSteps} / {taskMetrics.totalSteps} steps
                  </p>
                </div>
              </div>
              
              <div className="bg-muted/40 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Issues</span>
                </div>
                {taskMetrics.errorCount > 0 ? (
                  <p className="text-lg font-semibold text-amber-500">
                    {taskMetrics.errorCount} error{taskMetrics.errorCount !== 1 ? 's' : ''} detected
                  </p>
                ) : (
                  <p className="text-lg font-semibold text-green-500">No issues detected</p>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="performance">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium flex items-center gap-1">
                      <Cpu className="h-4 w-4" /> CPU Usage
                    </span>
                    <span className="text-sm">{taskMetrics.cpuUsage}%</span>
                  </div>
                  <Progress value={taskMetrics.cpuUsage} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Memory Usage</span>
                    <span className="text-sm">{taskMetrics.memoryUsage}%</span>
                  </div>
                  <Progress value={taskMetrics.memoryUsage} className="h-2" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Zap className="h-4 w-4" /> Execution Speed
                  </span>
                  <span className="text-sm">{taskMetrics.executionSpeed}% of optimal</span>
                </div>
                <Progress value={taskMetrics.executionSpeed} className="h-2" />
              </div>
              
              <div className="bg-muted/40 p-3 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Performance Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  {taskMetrics.executionSpeed > 90 
                    ? "Task is executing at optimal performance levels."
                    : taskMetrics.executionSpeed > 70
                    ? "Task is executing with good performance, but could be optimized."
                    : "Task is executing slower than expected. Consider optimizing or allocating more resources."}
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="timeline">
            <div className="space-y-4">
              <div className="relative pt-2">
                {task.steps.map((step, index) => (
                  <div key={step.id} className="mb-4 relative pl-6">
                    {/* Timeline connector */}
                    {index < task.steps.length - 1 && (
                      <div className="absolute left-[9px] top-5 w-0.5 h-full bg-muted-foreground/20" />
                    )}
                    
                    {/* Status indicator */}
                    <div 
                      className={`absolute left-0 top-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center
                        ${step.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                          step.status === 'failed' ? 'bg-red-500/20 text-red-500' :
                          step.status === 'running' ? 'bg-blue-500/20 text-blue-500' :
                          'bg-muted-foreground/20 text-muted-foreground'}`}
                    >
                      <div className={`w-2 h-2 rounded-full 
                        ${step.status === 'completed' ? 'bg-green-500' :
                          step.status === 'failed' ? 'bg-red-500' :
                          step.status === 'running' ? 'bg-blue-500 animate-pulse' :
                          'bg-muted-foreground'}`} 
                      />
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">
                        {step.description}
                      </p>
                      
                      {step.status === 'running' && step.progress !== undefined && (
                        <div className="mt-1">
                          <Progress value={step.progress} className="h-1" />
                        </div>
                      )}
                      
                      {step.result && step.status === 'completed' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {step.result}
                        </p>
                      )}
                      
                      {step.error && step.status === 'failed' && (
                        <p className="text-xs text-red-500 mt-1">
                          {step.error}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
