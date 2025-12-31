'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Loader2,
  Smile,
  Meh,
  Frown,
  Check,
  Heart
} from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  status: string;
}

interface CheckInFormProps {
  goals: Goal[];
  selectedGoalId?: string;
  initialMood?: string;
}

const MOODS = [
  { value: 'great', label: 'Great', icon: Smile, color: 'text-chart-2' },
  { value: 'good', label: 'Good', icon: Smile, color: 'text-chart-1' },
  { value: 'struggling', label: 'Struggling', icon: Meh, color: 'text-chart-4' },
  { value: 'stuck', label: 'Stuck', icon: Frown, color: 'text-destructive' },
];

export function CheckInForm({ goals, selectedGoalId, initialMood }: CheckInFormProps) {
  const router = useRouter();
  const [goalId, setGoalId] = useState(selectedGoalId || '');
  const [mood, setMood] = useState(initialMood || '');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const activeGoals = goals.filter(g => g.status === 'active');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!goalId || !mood) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/check-ins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          type: 'daily',
          mood,
          content: content.trim() || null,
          isPublic,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit check-in');
      }

      setShowSuccess(true);
      setTimeout(() => {
        router.push(`/goals/${goalId}`);
      }, 1500);
    } catch (error) {
      console.error('Error submitting check-in:', error);
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-muted/50 via-background to-card/50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-chart-2/10 rounded-full mb-4">
              <Check className="w-8 h-8 text-chart-2" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Check-in Recorded!</h2>
            <p className="text-muted-foreground">
              Great job staying accountable 💪
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeGoals.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-muted/50 via-background to-card/50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-12 pb-12 text-center">
            <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No Active Goals</h2>
            <p className="text-muted-foreground mb-6">
              Create a goal first to start checking in!
            </p>
            <Button onClick={() => router.push('/planner')}>
              Create Goal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/50 via-background to-card/50">
      <div className="container mx-auto py-12 px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Daily Check-In</CardTitle>
            <CardDescription className="text-base">
              How are you doing with your goals today?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Goal Selection */}
              {activeGoals.length > 1 && (
                <div className="space-y-2">
                  <Label>Which goal?</Label>
                  <Select value={goalId} onValueChange={setGoalId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a goal" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeGoals.map((goal) => (
                        <SelectItem key={goal.id} value={goal.id}>
                          {goal.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Mood Selection */}
              <div className="space-y-3">
                <Label>How are you feeling about your progress?</Label>
                <div className="grid grid-cols-2 gap-3">
                  {MOODS.map((moodOption) => {
                    const Icon = moodOption.icon;
                    const isSelected = mood === moodOption.value;
                    
                    return (
                      <button
                        key={moodOption.value}
                        type="button"
                        onClick={() => setMood(moodOption.value)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-muted hover:border-primary/50'
                        }`}
                      >
                        <Icon className={`w-8 h-8 mx-auto mb-2 ${
                          isSelected ? 'text-primary' : moodOption.color
                        }`} />
                        <p className="text-sm font-medium">{moodOption.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Note */}
              <div className="space-y-2">
                <Label htmlFor="content">
                  Add a note (optional)
                </Label>
                <Textarea
                  id="content"
                  placeholder="What went well? What challenges did you face?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Public Toggle */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={(checked) => setIsPublic(checked as boolean)}
                />
                <Label
                  htmlFor="isPublic"
                  className="text-sm font-normal cursor-pointer"
                >
                  Share this check-in publicly (visible on your goal page)
                </Label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={!goalId || !mood || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Submit Check-In
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}