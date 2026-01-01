'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { 
  Calendar, 
  CheckCircle2, 
  Circle,
  ArrowRight,
  Globe,
  Lock,
  Loader2,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface GoalCardProps {
  goal: {
    id: string;
    title: string;
    slug: string;
    status: string;
    visibility: string;
    createdAt: Date;
    deadline: string | null;
    steps: Array<{
      id: string;
      status: string;
    }>;
  };
  onDelete?: (goalId: string, goalTitle: string) => void;
}

export function GoalCard({ goal, onDelete }: GoalCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [localGoal, setLocalGoal] = useState(goal);
  
  const totalSteps = localGoal.steps.length;
  const completedSteps = localGoal.steps.filter(s => s.status === 'completed').length;
  const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  
  const nextStep = localGoal.steps.find(s => s.status === 'pending' || s.status === 'in_progress');

  const handleVisibilityToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent card click navigation
    e.stopPropagation();
    
    const newVisibility = localGoal.visibility === 'private' ? 'public' : 'private';
    
    // Optimistic update - update UI immediately
    setLocalGoal(prev => ({ ...prev, visibility: newVisibility }));
    setIsUpdating(true);
    
    // Show success toast
    if (newVisibility === 'public') {
      toast.success('Goal is now public! 🌍');
    } else {
      toast.info('Goal is now private');
    }
    
    try {
      const response = await fetch('/api/update-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: localGoal.id,
          visibility: newVisibility
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        // Revert optimistic update if API fails
        setLocalGoal(prev => ({ ...prev, visibility: localGoal.visibility }));
        throw new Error(result.error || 'Failed to update visibility');
      }
    } catch (error) {
      // Revert optimistic update if API fails
      setLocalGoal(prev => ({ ...prev, visibility: localGoal.visibility }));
      toast.error('Failed to update visibility. Please try again.');
      console.error('Error updating visibility:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent card click navigation
    e.stopPropagation();
    
    if (onDelete) {
      onDelete(localGoal.id, localGoal.title);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-chart-1';
      case 'completed': return 'bg-chart-2';
      case 'paused': return 'bg-chart-4';
      default: return 'bg-muted';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      case 'paused': return 'Paused';
      case 'abandoned': return 'Abandoned';
      default: return status;
    }
  };

  return (
    <TooltipProvider>
      <Link href={`/goals/${goal.id}`}>
        <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
          <CardHeader>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getStatusColor(localGoal.status)}>
                  {getStatusText(localGoal.status)}
                </Badge>
                {/* Visibility Toggle */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleVisibilityToggle}
                      disabled={isUpdating}
                      className="h-6 px-2 text-xs"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : localGoal.visibility === 'private' ? (
                        <><Lock className="h-3 w-3 mr-1" />Private</>
                      ) : (
                        <><Globe className="h-3 w-3 mr-1" />Public</>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {localGoal.visibility === 'private' 
                        ? 'Click to make goal public' 
                        : 'Click to make goal private'
                      }
                    </p>
                  </TooltipContent>
                </Tooltip>
                {/* Delete Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete goal</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            {localGoal.deadline && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(localGoal.deadline).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            )}
          </div>
          <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors">
            {localGoal.title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {completedSteps}/{totalSteps} steps
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {Math.round(progressPercent)}% complete
            </p>
          </div>

          {/* Next Step */}
          {nextStep && localGoal.status === 'active' && (
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Next step:</p>
              <div className="flex items-start gap-2">
                <Circle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm line-clamp-2 flex-1">
                  Step {localGoal.steps.indexOf(nextStep) + 1}
                </p>
              </div>
            </div>
          )}

          {/* Completed Badge */}
          {localGoal.status === 'completed' && (
            <div className="pt-4 border-t flex items-center gap-2 text-chart-2">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Goal Completed! 🎉</span>
            </div>
          )}

          {/* View Details */}
          <div className="flex items-center text-sm text-primary group-hover:gap-2 transition-all">
            <span>View details</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </Link>
  </TooltipProvider>
);
}