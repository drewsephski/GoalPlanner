'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Target, 
  CheckCircle2, 
  Sparkles, 
  Copy, 
  Check, 
  Lightbulb,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const EXAMPLE_GOALS = [
  "Learn to play guitar in 3 months",
  "Start a small online business",
  "Get in shape and run a 5K",
  "Learn a new programming language",
  "Write and publish a book"
];

export function GoalPlanner() {
  const [goal, setGoal] = useState('');
  const [steps, setSteps] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const generateSteps = async () => {
    if (!goal.trim()) {
      setError('Please enter a goal');
      return;
    }

    setIsLoading(true);
    setError('');
    setSteps('');

    try {
      const response = await fetch('/api/generate-steps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goal }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate steps');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullResponse += chunk;
          setSteps(fullResponse);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateSteps();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(steps);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleExampleClick = (exampleGoal: string) => {
    setGoal(exampleGoal);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/50 via-background to-card/50">
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8 space-y-4">
          <div className="inline-flex items-center justify-center p-3 sm:p-4 bg-primary rounded-2xl shadow-lg shadow-primary/25 mb-4 sm:mb-6">
            <Target className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
            AI Goal Planner
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Transform your ambitions into actionable steps. Enter your goal and let AI create a personalized roadmap to success.
          </p>
        </div>

        {/* Example Goals */}
        {!steps && !isLoading && (
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-chart-1" />
              <span className="text-sm font-medium text-muted-foreground">Try these examples:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_GOALS.map((example, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted hover:border-primary hover:text-foreground transition-all duration-200 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                  onClick={() => handleExampleClick(example)}
                >
                  {example}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Input Card */}
        <Card className="mb-6 sm:mb-8 border-2 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-2 px-4 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              Enter Your Goal
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Be specific about what you want to accomplish. The more detail you provide, the better your action plan will be.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <div className="space-y-2">
              <Label htmlFor="goal-input" className="text-sm sm:text-base font-medium">Your Goal</Label>
              <Textarea
                id="goal-input"
                placeholder="e.g., Learn to play guitar, Start a small business, Get in shape..."
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                onKeyPress={handleKeyPress}
                rows={3}
                className="resize-none text-sm sm:text-base border-2 focus:border-primary transition-colors"
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button 
                onClick={generateSteps} 
                disabled={isLoading || !goal.trim()}
                className="flex-1 h-12 sm:h-12 text-sm sm:text-base bg-gradient-to-r from-primary to-chart-2 hover:from-primary/90 hover:to-chart-2/90 shadow-lg shadow-primary/25"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    <span className="hidden sm:inline">Generating Your Action Plan...</span>
                    <span className="sm:hidden">Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">Generate Action Plan</span>
                    <span className="sm:hidden">Generate</span>
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 hidden sm:inline" />
                  </>
                )}
              </Button>
              {steps && (
                <Button
                  onClick={() => {
                    setSteps('');
                    setGoal('');
                  }}
                  variant="outline"
                  size="lg"
                  className="h-12 sm:h-12"
                >
                  <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              )}
            </div>
            {error && (
              <div className="flex items-start gap-3 p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="text-destructive mt-0.5">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-destructive">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card className="mb-6 sm:mb-8 border-2 border-primary/20 bg-gradient-to-br from-muted/50 to-card/50">
            <CardContent className="py-8 sm:py-12">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                  <Loader2 className="relative h-10 w-10 sm:h-12 sm:w-12 text-primary animate-spin" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-base sm:text-lg font-medium text-foreground">
                    Creating your personalized action plan...
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This may take a few moments
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Card */}
        {steps && !isLoading && (
          <Card className="border-2 shadow-xl bg-card/90 backdrop-blur-sm">
            <CardHeader className="space-y-2 px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-full">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                    </div>
                    Your Action Plan
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Follow these steps to achieve your goal
                  </CardDescription>
                </div>
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                  className="gap-2 self-start sm:self-auto"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-primary" />
                      <span className="hidden sm:inline">Copied!</span>
                      <span className="sm:hidden">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span className="hidden sm:inline">Copy</span>
                      <span className="sm:hidden">Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:font-semibold prose-h2:text-lg sm:text-xl prose-h2:mt-4 sm:mt-6 prose-h2:mb-2 sm:mb-3 prose-p:text-sm sm:text-base prose-p:leading-relaxed prose-ul:space-y-1 sm:space-y-2 prose-li:marker:text-primary">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {steps}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-8 sm:mt-12 text-center text-xs sm:text-sm text-muted-foreground">
          <p>Powered by AI • Built with Vercel AI SDK</p>
        </div>
      </div>
    </div>
  );
}
