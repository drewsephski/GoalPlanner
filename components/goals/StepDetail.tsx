'use client';

// import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Circle,
  Target,
  Lightbulb,
  AlertCircle,
  Play,
  Pause
} from 'lucide-react';
import { StepExpander } from './StepExpander';

interface StepDetailProps {
  step: {
    id: string;
    title: string;
    description: string | null;
    dueDate: string | null;
    status: string;
    completedAt: Date | null;
    orderNum: number;
  };
  stepNumber: number;
  goalTitle: string;
  goalContext: {
    deadline?: string;
    timeCommitment?: string;
    biggestConcern?: string;
  };
  onToggle: () => void;
  onStatusChange?: (newStatus: string) => void;
  onSubStepsCreated?: (stepId: string, subSteps: Array<{
    title: string;
    description: string;
    estimatedTime: string;
  }>) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function StepDetail({ 
  step, 
  stepNumber, 
  goalTitle,
  goalContext,
  onToggle, 
  onStatusChange,
  onSubStepsCreated,
  isOpen,
  onClose
}: StepDetailProps) {
  // const [isExpanding, setIsExpanding] = useState(false);
  const isCompleted = step.status === 'completed';
  // const isPaused = step.status === 'paused';
  const daysUntilDue = step.dueDate ? 
    Math.ceil((new Date(step.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
    null;

  const handleSubStepsCreated = (stepId: string, subSteps: Array<{
    title: string;
    description: string;
    estimatedTime: string;
  }>) => {
    if (onSubStepsCreated) {
      onSubStepsCreated(stepId, subSteps);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-chart-2 text-chart-2';
      case 'in_progress': return 'bg-chart-1 text-chart-1';
      case 'paused': return 'bg-chart-4 text-chart-4';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'paused': return 'Paused';
      case 'pending': return 'Not Started';
      default: return status;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">{stepNumber}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {step.title}
                <Badge variant="outline" className={getStatusColor(step.status)}>
                  {getStatusText(step.status)}
                </Badge>
              </div>
              {step.description && (
                <DialogDescription className="text-base">
                  {step.description}
                </DialogDescription>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Step Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant="outline" className={getStatusColor(step.status)}>
                    {getStatusText(step.status)}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {!isCompleted && (
                    <>
                      {step.status === 'paused' ? (
                        <Button 
                          size="sm" 
                          onClick={() => handleStatusChange('in_progress')}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Resume
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleStatusChange('paused')}
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        onClick={onToggle}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    </>
                  )}
                  {isCompleted && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStatusChange('pending')}
                    >
                      <Circle className="h-4 w-4 mr-1" />
                      Reopen
                    </Button>
                  )}
                </div>
              </div>

              {/* Due Date */}
              {step.dueDate && (
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Due: {new Date(step.dueDate).toLocaleDateString()}</span>
                  </div>
                  {daysUntilDue !== null && (
                    <div className={`flex items-center gap-1 ${
                      daysUntilDue < 0 ? 'text-destructive' : 
                      daysUntilDue <= 3 ? 'text-chart-4' : 
                      'text-muted-foreground'
                    }`}>
                      <Clock className="h-4 w-4" />
                      {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` :
                       daysUntilDue === 0 ? 'Due today' :
                       `${daysUntilDue} days remaining`}
                    </div>
                  )}
                </div>
              )}

              {/* Completion Date */}
              {step.completedAt && (
                <div className="flex items-center gap-2 text-sm text-chart-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Completed on {new Date(step.completedAt).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Expansion */}
          {!isCompleted && goalTitle && goalContext && onSubStepsCreated && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  AI-Powered Breakdown
                </CardTitle>
                <CardDescription>
                  Let AI break this step down into smaller, manageable sub-steps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StepExpander
                  stepId={step.id}
                  stepTitle={step.title}
                  stepDescription={step.description}
                  goalTitle={goalTitle}
                  goalContext={goalContext}
                  onSubStepsCreated={handleSubStepsCreated}
                />
              </CardContent>
            </Card>
          )}

          {/* Tips and Guidance */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Break it down further</p>
                    <p className="text-muted-foreground">If this step feels too big, use the AI expansion above to create sub-steps.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Time blocking</p>
                    <p className="text-muted-foreground">Schedule dedicated time blocks for this step to ensure progress.</p>
                  </div>
                </div>
                {step.dueDate && daysUntilDue !== null && daysUntilDue <= 3 && (
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-chart-4 mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-chart-4">Deadline approaching!</p>
                      <p className="text-muted-foreground">This step is due soon. Consider prioritizing it today.</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            {!isCompleted && (
              <Button onClick={onToggle} className="flex-1">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
