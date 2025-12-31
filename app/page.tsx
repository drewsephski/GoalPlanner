import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Target, Sparkles, CheckCircle2, Users } from 'lucide-react';

export default async function HomePage() {
    const { userId } = await auth();

    // Redirect authenticated users to dashboard
    if (userId) {
        redirect('/dashboard');
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-muted/50 via-background to-card/50">
            {/* Hero Section */}
            <div className="container mx-auto px-4 py-20">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <div className="inline-flex items-center justify-center p-4 bg-primary rounded-2xl shadow-lg shadow-primary/25 mb-6">
                        <Target className="w-12 h-12 text-primary-foreground" />
                    </div>

                    <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                        Turn Goals into Achievements
                    </h1>

                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        AI-powered goal planning with social accountability. Create your plan, track progress, and celebrate wins with a supportive community.
                    </p>

                    <div className="flex gap-4 justify-center">
                        <Link href="/sign-up">
                            <Button size="lg" className="text-lg px-8 bg-gradient-to-r from-primary to-chart-2">
                                <Sparkles className="mr-2 h-5 w-5" />
                                Get Started Free
                            </Button>
                        </Link>
                        <Link href="/sign-in">
                            <Button size="lg" variant="outline" className="text-lg px-8">
                                Sign In
                            </Button>
                        </Link>
                    </div>
                </div>
                {/* Features */}
                <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto">
                    <div className="text-center space-y-3">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-2">
                            <Sparkles className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold">AI-Powered Plans</h3>
                        <p className="text-muted-foreground">
                            Get personalized action plans tailored to your timeline and concerns
                        </p>
                    </div>

                    <div className="text-center space-y-3">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-2">
                            <CheckCircle2 className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold">Track Progress</h3>
                        <p className="text-muted-foreground">
                            Daily check-ins and adaptive coaching keep you on track
                        </p>
                    </div>

                    <div className="text-center space-y-3">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-2">
                            <Users className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold">Share Your Journey</h3>
                        <p className="text-muted-foreground">
                            Celebrate wins and inspire others with shareable progress updates
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}   