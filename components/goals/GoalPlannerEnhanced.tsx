'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  Target, 
  Sparkles, 
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Clock,
  AlertCircle,
  Heart
} from 'lucide-react';

const EXAMPLE_GOALS = [
  "Learn to play guitar in 3 months",
  "Start a small online business",
  "Get in shape and run a 5K",
  "Learn Python programming",
  "Write and publish a book"
];

interface FormData {
  title: string;
  why: string;
  deadline: string;
  timeCommitment: string;
  biggestConcern: string;
}

export function GoalPlannerEnhanced() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    why: '',
    deadline: '',
    timeCommitment: '',
    biggestConcern: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const canProceed = () => {
    switch (step) {
      case 1: return formData.title.trim().length > 0;
      case 2: return formData.why.trim().length > 0;
      case 3: return formData.deadline.length > 0;
      case 4: return formData.timeCommitment.trim().length > 0;
      case 5: return formData.biggestConcern.trim().length > 0;
      default: return false;
    }
  };

  const handleNext = () => {
    if (!canProceed()) {
      setError('Please fill out this field');
      return;
    }
    setError('');
    setStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setError('');
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!canProceed()) {
      setError('Please fill out this field');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create goal');
      }

      const { goalId } = await response.json();
      
      // Redirect to goal detail page
      router.push(`/goals/${goalId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSubmitting(false);
    }
  };

  const handleExampleClick = (example: string) => {
    updateField('title', example);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (step < totalSteps) {
        handleNext();
      } else {
        handleSubmit();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/50 via-background to-card/50">
      <div className="container mx-auto py-12 px-4 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8 space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-primary rounded-2xl shadow-lg shadow-primary/25 mb-6">
            <Target className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
            Create Your Goal
          </h1>
          <p className="text-muted-foreground">
            Step {step} of {totalSteps}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
        </div>

        {/* Form Card */}
        <Card className="border-2 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              {step === 1 && <><Sparkles className="w-6 h-6 text-primary" /> What&apos;s Your Goal?</>}
              {step === 2 && <><Heart className="w-6 h-6 text-primary" /> Why Does This Matter?</>}
              {step === 3 && <><Calendar className="w-6 h-6 text-primary" /> When&apos;s Your Deadline?</>}
              {step === 4 && <><Clock className="w-6 h-6 text-primary" /> Time Commitment</>}
              {step === 5 && <><AlertCircle className="w-6 h-6 text-primary" /> Biggest Concern</>}
            </CardTitle>
            <CardDescription className="text-base">
              {step === 1 && "Be specific about what you want to accomplish"}
              {step === 2 && "Understanding your motivation helps create a better plan"}
              {step === 3 && "Having a deadline keeps you accountable"}
              {step === 4 && "Let's make sure this is realistic"}
              {step === 5 && "Let's address potential obstacles upfront"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Goal Title */}
            {step === 1 && (
              <div className="space-y-4">
                {/* Example Goals */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-chart-1" />
                    <span className="text-sm font-medium text-muted-foreground">Try these examples:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLE_GOALS.map((example, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer hover:bg-muted hover:border-primary transition-all px-3 py-2"
                        onClick={() => handleExampleClick(example)}
                      >
                        {example}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base font-medium">Your Goal</Label>
                  <Textarea
                    id="title"
                    placeholder="e.g., Learn to play guitar, Start a business, Run a 5K..."
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    onKeyPress={handleKeyPress}
                    rows={3}
                    className="resize-none text-base"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Step 2: Why */}
            {step === 2 && (
              <div className="space-y-2">
                <Label htmlFor="why" className="text-base font-medium">
                  Why does this goal matter to you?
                </Label>
                <Textarea
                  id="why"
                  placeholder="This will help anchor your motivation when things get tough..."
                  value={formData.why}
                  onChange={(e) => updateField('why', e.target.value)}
                  onKeyPress={handleKeyPress}
                  rows={4}
                  className="resize-none text-base"
                  autoFocus
                />
                <p className="text-sm text-muted-foreground">
                  Be honest and personal. This is just for you.
                </p>
              </div>
            )}

            {/* Step 3: Deadline */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deadline" className="text-base font-medium">
                    When do you want to achieve this?
                  </Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => updateField('deadline', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="text-base"
                    autoFocus
                  />
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    💡 <strong>Tip:</strong> Ambitious deadlines are great, but make sure they&apos;re realistic. 
                    We&apos;ll help you adjust if needed.
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Time Commitment */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="timeCommitment" className="text-base font-medium">
                    How much time can you dedicate per week?
                  </Label>
                  <Input
                    id="timeCommitment"
                    type="text"
                    placeholder="e.g., 2 hours, 30 minutes daily, 1 hour 3x/week..."
                    value={formData.timeCommitment}
                    onChange={(e) => updateField('timeCommitment', e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="text-base"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Quick suggestions:</p>
                  <div className="flex flex-wrap gap-2">
                    {['30 min/day', '1 hour/day', '2 hours/day', '5 hours/week', '10 hours/week'].map((suggestion) => (
                      <Badge
                        key={suggestion}
                        variant="outline"
                        className="cursor-pointer hover:bg-muted hover:border-primary transition-all"
                        onClick={() => updateField('timeCommitment', suggestion)}
                      >
                        {suggestion}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Biggest Concern */}
            {step === 5 && (
              <div className="space-y-2">
                <Label htmlFor="biggestConcern" className="text-base font-medium">
                  What&apos;s your biggest concern about achieving this goal?
                </Label>
                <Textarea
                  id="biggestConcern"
                  placeholder="e.g., Not enough time, lack of motivation, don't know where to start..."
                  value={formData.biggestConcern}
                  onChange={(e) => updateField('biggestConcern', e.target.value)}
                  onKeyPress={handleKeyPress}
                  rows={4}
                  className="resize-none text-base"
                  autoFocus
                />
                <p className="text-sm text-muted-foreground">
                  We&apos;ll address this in your action plan
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <Button
                  onClick={handleBack}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Back
                </Button>
              )}
              
              {step < totalSteps ? (
                <Button
                  onClick={handleNext}
                  size="lg"
                  className={`${step === 1 ? 'flex-1' : 'flex-1'} bg-gradient-to-r from-primary to-chart-2`}
                  disabled={!canProceed()}
                >
                  Next
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  size="lg"
                  className="flex-1 bg-gradient-to-r from-primary to-chart-2"
                  disabled={!canProceed() || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Your Plan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate My Plan
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress Indicator */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Press Enter to continue
        </div>
      </div>
    </div>
  );
}