'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  Heart,
  CheckCircle2,
  Sparkles,
  Twitter,
  Linkedin,
  Facebook,
  Link as LinkIcon,
  ArrowRight
} from 'lucide-react';
import { useState } from 'react';
import { generateShareText, generateShareLinks } from '@/lib/share/generate-share-text';
import { PublicStepSubSteps } from '@/components/public/PublicStepSubSteps';

interface PublicGoalViewProps {
  goal: {
    id: string;
    title: string;
    why: string | null;
    steps: Array<{
      id: string;
      title: string;
      description: string | null;
      status: string;
    }>;
    startedAt: Date | string;
    slug: string;
    status: string;
    deadline: Date | string | null;
    timeCommitment: string | null;
    biggestConcern: string | null;
  };
  user: {
    id: string;
    username: string | null;
    firstName: string | null;
  };
  checkIns: Array<{
    id: string;
    mood: string | null;
    createdAt: Date | string;
    content: string | null;
  }>;
  isOwner?: boolean;
}

export function PublicGoalView({ goal, user, checkIns, isOwner = false }: PublicGoalViewProps) {
  const [copied, setCopied] = useState(false);
  
  const totalSteps = goal.steps.length;
  const completedSteps = goal.steps.filter((s) => s.status === 'completed').length;
  const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const daysSinceStart = Math.floor(
    (new Date().getTime() - new Date(goal.startedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const shareText = generateShareText(goal.title, 'progress', {
    completedSteps,
    totalSteps,
    progressPercent: Math.round(progressPercent),
    daysSinceStart,
  });

  const shareLinks = generateShareLinks(
    shareText,
    `${process.env.NEXT_PUBLIC_APP_URL}/${user.username}/goals/${goal.slug}`
  );

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${process.env.NEXT_PUBLIC_APP_URL}/${user.username}/goals/${goal.slug}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/50 via-background to-card/50">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                {user.firstName?.[0] || user.username?.[0] || '?'}
              </div>
              <div>
                <p className="font-medium">{user.firstName || user.username}&apos;s Goal</p>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
            </div>
            {isOwner && (
              <Link href={`/goals/${goal.id}`}>
                <Button variant="outline" size="sm">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  View Private Version
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Goal Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between mb-4">
              <Badge variant="outline">
                {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
              </Badge>
              {goal.deadline && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  Due {new Date(goal.deadline).toLocaleDateString()}
                </div>
              )}
            </div>
            
            <CardTitle className="text-3xl mb-3">{goal.title}</CardTitle>
            
            {goal.why && (
              <CardDescription className="text-base flex items-start gap-2 mt-3">
                <Heart className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>{goal.why}</span>
              </CardDescription>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {completedSteps}/{totalSteps} steps • Day {daysSinceStart}
                </span>
              </div>
              <Progress value={progressPercent} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {Math.round(progressPercent)}% complete
              </p>
            </div>

            {/* Share Buttons */}
            <div className="pt-6 border-t">
              <p className="text-sm font-medium mb-3">Share this journey:</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(shareLinks.twitter, '_blank')}
                >
                  <Twitter className="h-4 w-4 mr-2" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(shareLinks.linkedin, '_blank')}
                >
                  <Linkedin className="h-4 w-4 mr-2" />
                  LinkedIn
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(shareLinks.facebook, '_blank')}
                >
                  <Facebook className="h-4 w-4 mr-2" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Steps Progress */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Progress Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {goal.steps.map((step, index: number) => (
                <div
                  key={step.id}
                  className="border rounded-lg overflow-hidden"
                >
                  {/* Step Header */}
                  <div className="flex items-start gap-3 p-4 bg-muted/30">
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-chart-2 flex-shrink-0 mt-0.5" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${step.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                        {index + 1}. {step.title}
                      </p>
                      {step.description && (
                        <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* AI-Powered Sub-Steps (Read-only) */}
                  <PublicStepSubSteps
                    stepTitle={step.title}
                    stepDescription={step.description}
                    goalTitle={goal.title}
                    goalContext={{
                      deadline: goal.deadline ? String(goal.deadline) : undefined,
                      timeCommitment: goal.timeCommitment || undefined,
                      biggestConcern: goal.biggestConcern || undefined,
                    }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Check-In Timeline */}
        {checkIns.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Progress Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {checkIns.map((checkIn) => (
                  <div key={checkIn.id} className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="capitalize">
                        {checkIn.mood || 'No mood'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(checkIn.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {checkIn.content && (
                      <p className="text-sm">{checkIn.content}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <Card className="bg-gradient-to-br from-primary/10 to-chart-2/10 border-primary/20">
          <CardContent className="pt-6 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-2xl font-bold mb-2">Start Your Own Goal</h3>
            <p className="text-muted-foreground mb-6">
              Get AI-powered plans and track your progress like {user.firstName || user.username}
            </p>
            <Link href="/sign-up">
              <Button size="lg" className="bg-gradient-to-r from-primary to-chart-2">
                Get Started Free
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}