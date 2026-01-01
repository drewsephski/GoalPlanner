'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, CheckCircle2, ArrowRight, ChevronDown, ChevronRight, Edit2, Save, X, Trash2, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import { StepExpander } from './StepExpander';
import { StepDetail } from './StepDetail';
import { toast } from 'sonner';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

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
  onSubStepToggle?: (subStepId: string) => void;
  subSteps?: Array<{
    id: string;
    title: string;
    description: string;
    completed: boolean;
    orderNum: number;
  }>;
  onUpdate?: (stepId: string, data: { title?: string; description?: string; dueDate?: string }) => void;
  onDelete?: (stepId: string) => void;
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
  onSubStepToggle,
  subSteps,
  onUpdate,
  onDelete
}: StepItemProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [expandedSubSteps, setExpandedSubSteps] = useState<Record<string, boolean>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(step.title);
  const [editDescription, setEditDescription] = useState(step.description || '');
  const [editDueDate, setEditDueDate] = useState(step.dueDate || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // DnD Kit sortable hook
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const isCompleted = step.status === 'completed';

  // Debug logging
  console.log('StepItem rendered for step:', step.id, 'subSteps:', subSteps);

  const handleStepClick = (e: React.MouseEvent) => {
    // Prevent opening detail if clicking on checkbox or buttons
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input[type="checkbox"]')) {
      return;
    }
    setIsDetailOpen(true);
  };

  // const handleSubStepToggle = (subStepId: string) => {
  //   setExpandedSubSteps(prev => ({
  //     ...prev,
  //     [subStepId]: !prev[subStepId]
  //   }));
  // };

  const handleAccordionToggle = (stepId: string) => {
    setExpandedSubSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  const handleSubStepCheckboxToggle = (subStepId: string) => {
    if (onSubStepToggle) {
      onSubStepToggle(subStepId);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(step.id, newStatus);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditTitle(step.title);
    setEditDescription(step.description || '');
    setEditDueDate(step.dueDate || '');
  };

  const handleSave = async () => {
    if (!editTitle.trim()) {
      toast.error('Step title is required');
      return;
    }

    setIsUpdating(true);
    
    try {
      if (onUpdate) {
        await onUpdate(step.id, {
          title: editTitle.trim(),
          description: editDescription.trim() || undefined,
          dueDate: editDueDate || undefined
        });
      }
      setIsEditing(false);
      toast.success('Step updated successfully');
    } catch (error) {
      toast.error('Failed to update step');
      console.error('Error updating step:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditTitle(step.title);
    setEditDescription(step.description || '');
    setEditDueDate(step.dueDate || '');
  };

  const handleDelete = async () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (onDelete) {
      setIsDeleting(true);
      try {
        await onDelete(step.id);
        setShowDeleteDialog(false);
      } catch (error) {
        console.error('Error deleting step:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <>
      <div 
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
        }}
        className={`flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer ${
          isDragging ? 'opacity-50 scale-95 shadow-lg border-primary' : 'hover:bg-muted/50'
        }`}
        onClick={handleStepClick}
      >
        {/* Drag Handle */}
        <div 
          {...attributes}
          {...listeners}
          className="cursor-move mt-1"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <Checkbox
          checked={isCompleted}
          onCheckedChange={onToggle}
          disabled={disabled || isEditing}
          className="mt-1"
          onClick={(e) => e.stopPropagation()}
        />
        
        <div className="flex-1 space-y-1">
          {isEditing ? (
            /* Editing Interface */
            <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Step title"
                className="font-medium"
                disabled={isUpdating}
              />
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Step description (optional)"
                rows={2}
                disabled={isUpdating}
              />
              <Input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                placeholder="Due date (optional)"
                disabled={isUpdating}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isUpdating || !editTitle.trim()}
                  className="flex-1"
                >
                  {isUpdating ? (
                    <>
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isUpdating}
                  className="flex-1"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            /* Normal View */
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                    {stepNumber}. {step.title}
                  </p>
                  {step.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Edit/Delete Buttons */}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEdit}
                      className="h-7 w-7 p-0"
                      disabled={isCompleted}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  {goalTitle && goalContext && onSubStepsCreated && !isCompleted && (
                    <StepExpander
                      stepId={step.id}
                      stepTitle={step.title}
                      stepDescription={step.description}
                      goalTitle={goalTitle}
                      goalContext={goalContext}
                      onSubStepsCreated={onSubStepsCreated}
                    />
                  )}
                  {isCompleted && (
                    <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Done
                    </Badge>
                  )}
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* Due Date & Completed Date */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {step.dueDate && !isCompleted && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due {format(new Date(step.dueDate), 'MMM d')}
                  </div>
                )}
                {step.completedAt && (
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Completed {format(new Date(step.completedAt), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Sub-steps Accordion */}
          {subSteps && subSteps.length > 0 && (
            <div className="mt-3 border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAccordionToggle(step.id)}
                  className="h-6 px-2 text-xs font-medium"
                >
                  {expandedSubSteps[step.id] ? (
                    <ChevronDown className="h-3 w-3 mr-1" />
                  ) : (
                    <ChevronRight className="h-3 w-3 mr-1" />
                  )}
                  AI Sub-Steps ({subSteps.length})
                </Button>
                <div className="text-xs text-muted-foreground">
                  {subSteps.filter(s => s.completed).length}/{subSteps.length} completed
                </div>
              </div>
              
              {/* Individual Sub-steps */}
              {expandedSubSteps[step.id] && (
                <div className="space-y-2 ml-4">
                  {subSteps.map((subStep, index) => (
                    <div key={subStep.id} className="flex items-start gap-2 p-2 rounded-md bg-muted/30 border-l-2 border-primary/30">
                      <Checkbox
                        checked={subStep.completed}
                        onCheckedChange={() => handleSubStepCheckboxToggle(subStep.id)}
                        className="mt-0.5 h-4 w-4"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${subStep.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {index + 1}. {subStep.title}
                        </p>
                        {subStep.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {subStep.description}
                          </p>
                        )}
                      </div>
                      {subStep.completed && (
                        <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Step Detail Dialog */}
      {goalTitle && goalContext && (
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Step"
        description={`Are you sure you want to delete "${step.title}"? This action cannot be undone.`}
        confirmText="Delete Step"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </>
  );
}

export default StepItem;