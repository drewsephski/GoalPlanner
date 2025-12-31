'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface StepItemProps {
  step: {
    id: string;
    title: string;
    description: string | null;
    dueDate: string | null;
    status: string;
    completedAt: Date | null;
  };
  stepNumber: number;
  onToggle: () => void;
  disabled?: boolean;
}

export function StepItem({ step, stepNumber, onToggle, disabled }: StepItemProps) {
  const isCompleted = step.status === 'completed';

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
      <Checkbox
        checked={isCompleted}
        onCheckedChange={onToggle}
        disabled={disabled}
        className="mt-1"
      />
      
      <div className="flex-1 space-y-1">
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
          
          {isCompleted && (
            <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2/20">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Done
            </Badge>
          )}
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
      </div>
    </div>
  );
}

export default StepItem;