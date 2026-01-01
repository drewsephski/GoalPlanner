import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Target, Sparkles, CheckCircle2, Users, ArrowRight, TrendingUp, Calendar, Share2, Brain, BarChart3 } from 'lucide-react';
import AnimatedBackground from '@/components/ui/animated-background';
import { LandingNavigation } from '@/components/navigation/LandingNavigation';

export default async function HomePage() {
    const { userId } = await auth();

    // Redirect authenticated users to dashboard
    if (userId) {
        redirect('/dashboard');
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background relative overflow-hidden">
            <LandingNavigation />
            {/* Enhanced Background decoration */}
            <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,white_10%,transparent_75%)]" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-chart-2/5 rounded-full blur-3xl" />
            
            {/* Hero Section */}
            <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
                <div className="max-w-6xl mx-auto text-center space-y-12">
                    <div className="inline-flex items-center justify-center p-5 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl backdrop-blur-sm border border-primary/10 mb-6">
                        <Target className="w-14 h-14 text-primary" />
                    </div>

                    <div className="space-y-8">
                        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.1] tracking-tight">
                            <span className="bg-gradient-to-br from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                                Turn Goals into
                            </span>
                            <span className="block bg-gradient-to-br from-foreground/70 via-foreground/90 to-foreground/5 bg-clip-text text-transparent">
                                Achievements
                            </span>
                        </h1>
                        
                        <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
                            AI-powered goal planning with social accountability. Create your plan, track progress, and celebrate wins with a supportive community.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                        <Link href="/sign-up">
                            <Button size="lg" className="text-base md:text-lg px-10 py-7 bg-gradient-to-r from-primary to-chart-2 hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/20 group">
                                Get Started Free
                                <ArrowRight className="ml-2 h-8 w-8 group-hover:translate-x-1 transition-transform duration-200" />
                            </Button>
                        </Link>
                        <Link href="/sign-in">
                            <Button size="lg" variant="outline" className="text-base md:text-lg px-10 py-7 border-2 hover:bg-accent transition-all duration-300">
                                Sign In
                            </Button>
                        </Link>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-sm text-muted-foreground pt-2">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                            <span>No credit card required</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                            <span>Free forever plan</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                            <span>Cancel anytime</span>
                        </div>
                    </div>
                </div>

                {/* Enhanced Features Grid */}
                <div className="mt-24 md:mt-40 max-w-7xl mx-auto">
                    <div className="text-center mb-20 space-y-4">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">Everything You Need to Succeed</h2>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light">
                            Powerful features designed to keep you motivated and on track
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatedBackground
                            className='rounded-3xl bg-gradient-to-br from-card to-card/50 border border-border shadow-xl backdrop-blur-sm'
                            transition={{
                                type: 'spring',
                                bounce: 0.2,
                                duration: 0.6,
                            }}
                            enableHover
                        >
                            {[
                                {
                                    id: 1,
                                    title: 'Smart Goal Planning',
                                    description: 'AI creates personalized action plans based on your timeline and objectives.',
                                    icon: Brain,
                                },
                                {
                                    id: 2,
                                    title: 'Daily Check-ins',
                                    description: 'Track progress with quick daily updates and personalized coaching.',
                                    icon: Calendar,
                                },
                                {
                                    id: 3,
                                    title: 'Progress Analytics',
                                    description: 'Visual insights and trends to keep you motivated and informed.',
                                    icon: BarChart3,
                                },
                                {
                                    id: 4,
                                    title: 'Social Accountability',
                                    description: 'Share milestones and celebrate wins with your support network.',
                                    icon: Users,
                                },
                                {
                                    id: 5,
                                    title: 'Adaptive Coaching',
                                    description: 'AI adjusts your plan dynamically based on real progress data.',
                                    icon: TrendingUp,
                                },
                                {
                                    id: 6,
                                    title: 'Shareable Updates',
                                    description: 'Create beautiful progress cards to inspire and motivate others.',
                                    icon: Share2,
                                },
                            ].map((item, index) => (
                                <div key={index} data-id={`card-${index}`} className="h-full">
                                    <div className='flex flex-col items-center justify-center text-center space-y-5 p-8 h-full min-h-[240px]'>
                                        <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/15 to-chart-2/15 rounded-2xl flex-shrink-0 border border-primary/10">
                                            <item.icon className="w-8 h-8 text-primary" />
                                        </div>
                                        <div className="space-y-3 flex-1 flex flex-col justify-center">
                                            <h3 className='text-xl font-semibold text-foreground'>
                                                {item.title}
                                            </h3>
                                            <p className='text-sm text-muted-foreground leading-relaxed'>
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </AnimatedBackground>
                    </div>
                </div>

                {/* Enhanced How It Works */}
                <div className="mt-24 md:mt-40 max-w-6xl mx-auto">
                    <div className="text-center mb-20 space-y-4">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">How It Works</h2>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light">
                            Start achieving your goals in three simple steps
                        </p>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="text-center space-y-6 group">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/15 to-chart-2/15 rounded-3xl border border-primary/10 transition-all duration-300">
                                <Sparkles className="w-10 h-10 text-primary" />
                            </div>
                            <div className="space-y-3">
                                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-2">
                                    1
                                </div>
                                <h3 className="text-2xl font-semibold">Create Your Plan</h3>
                                <p className="text-muted-foreground text-base leading-relaxed">
                                    AI generates a personalized action plan tailored to your specific goals and timeline
                                </p>
                            </div>
                        </div>

                        <div className="text-center space-y-6 group">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/15 to-chart-2/15 rounded-3xl border border-primary/10 transition-all duration-300">
                                <CheckCircle2 className="w-10 h-10 text-primary" />
                            </div>
                            <div className="space-y-3">
                                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-2">
                                    2
                                </div>
                                <h3 className="text-2xl font-semibold">Track Progress</h3>
                                <p className="text-muted-foreground text-base leading-relaxed">
                                    Daily check-ins and adaptive coaching keep you motivated and on track every step
                                </p>
                            </div>
                        </div>

                        <div className="text-center space-y-6 group">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/15 to-chart-2/15 rounded-3xl border border-primary/10 transition-all duration-300">
                                <Users className="w-10 h-10 text-primary" />
                            </div>
                            <div className="space-y-3">
                                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-2">
                                    3
                                </div>
                                <h3 className="text-2xl font-semibold">Share & Celebrate</h3>
                                <p className="text-muted-foreground text-base leading-relaxed">
                                    Share your wins and inspire others with beautiful, shareable progress updates
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Enhanced CTA Section */}
                <div className="mt-24 md:mt-40 max-w-5xl mx-auto">
                    <div className="relative rounded-3xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-chart-2/10 to-primary/5" />
                        <div className="relative backdrop-blur-sm bg-card/80 border border-border p-12 md:p-20">
                            <div className="text-center space-y-8">
                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                                    Ready to Achieve Your Goals?
                                </h2>
                                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
                                    Join thousands of users who are already turning their dreams into reality with our AI-powered platform.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                                    <Link href="/sign-up">
                                        <Button size="lg" className="text-base md:text-lg px-10 py-7 bg-gradient-to-r from-primary to-chart-2 hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/20 group">
                                            Start Your Journey
                                            <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform duration-200"/>
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}