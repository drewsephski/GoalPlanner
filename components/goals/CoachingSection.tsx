'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  Loader2,
  MessageCircle,
  Sparkles,
  HelpCircle
} from 'lucide-react';

interface CoachingSectionProps {
  goalId: string;
}

const QUICK_QUESTIONS = [
  "I'm feeling stuck. What should I do?",
  "How can I stay motivated?",
  "Should I adjust my timeline?",
  "What's the best next step?",
];

export function CoachingSection({ goalId }: CoachingSectionProps) {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCoach, setShowCoach] = useState(false);

  const handleAsk = async (questionText?: string) => {
    const askQuestion = questionText || question.trim();
    
    if (!askQuestion) return;

    setIsLoading(true);
    setResponse('');
    setShowCoach(true);

    try {
      const res = await fetch('/api/coach/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          question: askQuestion,
        }),
      });

      if (!res.ok) throw new Error('Failed to get coaching');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          setResponse(prev => prev + chunk);
        }
      }
    } catch (error) {
      console.error('Error getting coaching:', error);
      setResponse('Sorry, I encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
      if (questionText) {
        setQuestion('');
      }
    }
  };

  return (
    <Card className="mb-6 border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-primary" />
          AI Coach
        </CardTitle>
        <CardDescription>
          Need help or advice? Ask your AI coach
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Questions */}
        {!showCoach && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              Quick questions:
            </p>
            <div className="grid gap-2">
              {QUICK_QUESTIONS.map((q, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start text-left h-auto py-3"
                  onClick={() => handleAsk(q)}
                  disabled={isLoading}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Question */}
        <div className="space-y-3 pt-4 border-t">
          <Textarea
            placeholder="Or ask your own question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            className="resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={() => handleAsk()}
            disabled={!question.trim() || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Ask Coach
              </>
            )}
          </Button>
        </div>

        {/* Response */}
        {response && (
          <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">Your Coach</p>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {response}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}