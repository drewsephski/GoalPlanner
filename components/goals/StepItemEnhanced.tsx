'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, CheckCircle2, ArrowRight, Pencil, X, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import { StepExpander } from './StepExpander';
import { StepDetail } from './StepDetail';

interface StepItemProps {
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
  onToggle: () => void;
  disabled?: boolean;
  goalTitle?: string;
  goalContext?: {
    deadline?: string;
    timeCommitment?: string;
    biggestConcern?: string;
  };
  onSubStepsCreated?: (stepId: string, subSteps: Array<{
    title: string;
    description: string;
    estimatedTime: string;
  }>) => void;
  onStatusChange?: (stepId: string, newStatus: string) => void;
  onUpdate?: (stepId: string, data: { title?: string; description?: string; dueDate?: string }) => void;
  onDelete?: (stepId: string) => void;
  onDragStart?: (stepId: string) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

export function StepItem({ 
  step, 
  stepNumber, 
  onToggle, 
  disabled, 
  goalTitle, 
  goalContext, 
  onSubStepsCreated,
  onStatusChange,
  onUpdate,
  onDelete,
  onDragStart,
  onDragEnd,
  isDragging
}: StepItemProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(step.title);
  const [editDescription, setEditDescription] = useState(step.description || '');
  const [editDueDate, setEditDueDate] = useState(step.dueDate || '');

  const isCompleted = step.status === 'completed';

  const handleStepClick = (e: React.MouseEvent) => {
    if (isEditing) return;
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input[type="checkbox"]') || (e.target as HTMLElement).closest('input')) {
      return;
    }
    setIsDetailOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditTitle(step.title);
    setEditDescription(step.description || '');
    setEditDueDate(step.dueDate || '');
  };

  const handleSaveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdate) {
      onUpdate(step.id, {
        title: editTitle,
        description: editDescription || undefined,
        dueDate: editDueDate || undefined
      });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditTitle(step.title);
    setEditDescription(step.description || '');
    setEditDueDate(step.dueDate || '');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this step?')) {
      if (onDelete) {
        onDelete(step.id);
      }
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(step.id, newStatus);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('stepId', step.id);
    if (onDragStart) {
      onDragStart(step.id);
    }
  };

  const handleDragEnd = () => {
    if (onDragEnd) {
      onDragEnd();
    }
  };

  if (isEditing) {
    return (
      <div 
        className="flex items-start gap-3 p-4 rounded-lg border-2 border-primary bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 text-muted-foreground font-mono text-sm">
          {stepNumber}.
        </div>
        
        <div className="flex-1 space-y-3">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Step title"
            className="font-medium"
            autoFocus
          />
          
          <Textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Step description (optional)"
            rows={2}
            className="resize-none"
          />
          
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Due Date (optional)</label>
              <Input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleSaveEdit}
                disabled={!editTitle.trim()}
              >
                Save
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${
          isDragging ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]' : 'hover:bg-muted/50'
        } cursor-pointer`}
        onClick={handleStepClick}
        draggable={onDragStart ? true : false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {onDragStart && (
          <div className="cursor-grab text-muted-foreground hover:text-foreground">
            <GripVertical className="h-5 w-5" />
          </div>
        )}
        
        <Checkbox
          checked={isCompleted}
          onCheckedChange={onToggle}
          disabled={disabled || isEditing}
          className="mt-1"
          onClick={(e) => e.stopPropagation()}
        />
        
        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                {stepNumber}. {step.title}
              </p>
              {step.description && !isEditing && (
                <p className="text-sm text-muted-foreground mt-1">
                  {step.description}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {!isCompleted && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditClick}
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              
              {goalTitle && goalContext && onSubStepsCreated && !isCompleted && !isEditing && (
                <StepExpander
                  stepId={step.id}
                  stepTitle={step.title}
                  stepDescription={step.description}
                  goalTitle={goalTitle}
                  goalContext={goalContext}
                  onSubStepsCreated={onSubStepsCreated}
                />
              )}
              
              {isCompleted && !isEditing && (
                <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Done
                </Badge>
              )}
              
              {onDelete && !isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              
              {!isEditing && (
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Due Date & Completed Date */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {step.dueDate && !isCompleted && !isEditing && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Due {format(new Date(step.dueDate), 'MMM d')}
              </div>
            )}
            {step.completedAt && !isEditing && (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Completed {format(new Date(step.completedAt), 'MMM d, yyyy')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step Detail Dialog */}
      {goalTitle && goalContext && !isEditing && (
        <StepDetail
          step={step}
          stepNumber={stepNumber}
          goalTitle={goalTitle}
          goalContext={goalContext}
          onToggle={onToggle}
          onStatusChange={handleStatusChange}
          onSubStepsCreated={onSubStepsCreated}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
        />
      )}
    </>
  );
}

export default StepItem;
