import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Target, Sparkles, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Welcome - Goal Planner Pro',
  description: 'Get started with your first goal',
};

export default async function OnboardingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/50 via-background to-card/50">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-primary rounded-2xl shadow-lg shadow-primary/25 mb-6">
            <Target className="w-12 h-12 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Welcome to Goal Planner Pro!</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Let&apos;s get you started with your first goal and turn your ambitions into achievable plans.
          </p>
        </div>

        {/* Quick Start Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Create Your First Goal
              </CardTitle>
              <CardDescription>
                Use AI to generate a personalized action plan for your goal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/planner">
                <Button className="w-full">
                  Get Started with AI
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-chart-2" />
                Go to Dashboard
              </CardTitle>
              <CardDescription>
                See your existing goals and track your progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  View Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle>What You Can Do</CardTitle>
            <CardDescription>
              Here&apos;s how to make the most of your goal planning journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">1</span>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Create Goals with AI</h4>
                <p className="text-sm text-muted-foreground">
                  Describe your goal and let AI create a detailed step-by-step plan tailored to your timeline
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">2</span>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Track Progress Daily</h4>
                <p className="text-sm text-muted-foreground">
                  Check in daily to update your progress and get adaptive coaching to stay on track
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">3</span>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Share Your Journey</h4>
                <p className="text-sm text-muted-foreground">
                  Make goals public to share progress with friends and build accountability
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
