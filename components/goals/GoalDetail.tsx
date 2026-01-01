'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle2, Sparkles, Lightbulb, Calendar as CalendarIcon } from 'lucide-react';
import {
    ArrowLeft,
    Calendar,
    AlertCircle,
    Heart,
    Loader2,
    MoreVertical,
    Play,
    Pause,
    Trash2,
    Share2,
    MessageCircle,
    Globe,
    Lock,
    BarChart3,
    History,
    FileText
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StepItem } from './StepItem';
import { CoachingSection } from './CoachingSection';
import { CheckInHistory } from './CheckInHistory';
import { ShareModal } from './ShareModal';
import { toast } from 'sonner';
import { GoalAnalytics } from './GoalAnalytics';

interface User {
    id: string;
    email: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface Goal {
    id: string;
    title: string;
    slug: string;
    why: string | null;
    deadline: string | null;
    timeCommitment: string | null;
    biggestConcern: string | null;
    aiPlan: {
        overview: string;
        steps: Array<{
            title: string;
            description: string;
            order: number;
        }>;
        timeline: string;
        tips: string[];
    } | null;
    status: string;
    visibility: string;
    startedAt: Date;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    steps: Array<{
        id: string;
        goalId: string;
        orderNum: number;
        title: string;
        description: string | null;
        dueDate: string | null;
        status: string;
        completedAt: Date | null;
        createdAt: Date;
    }>;
    user: User;
}

interface GoalDetailProps {
    goal: Goal;
    user: User;
}

export function GoalDetail({ goal, user }: GoalDetailProps) {
    const router = useRouter();
    const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
    const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean | Array<{ title: string; description: string; estimatedTime: string }>>>({});
    const [subStepsCompletion, setSubStepsCompletion] = useState<Record<string, boolean>>({});
    const [activeTab, setActiveTab] = useState('steps');
    const [localSteps, setLocalSteps] = useState(goal.steps);
    const [localGoalStatus, setLocalGoalStatus] = useState(goal.status);

    const totalSteps = localSteps.length;
    const completedSteps = localSteps.filter(s => s.status === 'completed').length;
    const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    const handleStepToggle = async (stepId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        
        // Optimistic update - update UI immediately
        setLocalSteps(prev => prev.map(step => 
            step.id === stepId 
                ? { ...step, status: newStatus, completedAt: newStatus === 'completed' ? new Date() : null }
                : step
        ));

        // Show success toast
        if (newStatus === 'completed') {
            toast.success('Step completed! Great job! 🎉');
        } else {
            toast.info('Step marked as incomplete');
        }

        try {
            const response = await fetch(`/api/steps/${stepId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                // Revert optimistic update if API fails
                setLocalSteps(prev => prev.map(step => 
                    step.id === stepId 
                        ? { ...step, status: currentStatus, completedAt: currentStatus === 'completed' ? step.completedAt : null }
                        : step
                ));
                throw new Error('Failed to update step');
            }
        } catch (error) {
            // Revert optimistic update if API fails
            setLocalSteps(prev => prev.map(step => 
                step.id === stepId 
                    ? { ...step, status: currentStatus, completedAt: currentStatus === 'completed' ? step.completedAt : null }
                    : step
            ));
            toast.error('Failed to update step. Please try again.');
            console.error('Error updating step:', error);
        }
    };

    const handleStepStatusChange = async (stepId: string, newStatus: string) => {
        const oldStatus = localSteps.find(s => s.id === stepId)?.status;
        
        // Optimistic update - update UI immediately
        setLocalSteps(prev => prev.map(step => 
            step.id === stepId 
                ? { ...step, status: newStatus, completedAt: newStatus === 'completed' ? new Date() : null }
                : step
        ));
        
        // Show success toast
        if (newStatus === 'completed') {
            toast.success('Step completed! Great job! 🎉');
        } else if (newStatus === 'in_progress') {
            toast.info('Step marked as in progress');
        } else if (newStatus === 'skipped') {
            toast.info('Step skipped');
        } else {
            toast.info('Step marked as pending');
        }
        
        try {
            const response = await fetch(`/api/steps/${stepId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                // Revert optimistic update if API fails
                setLocalSteps(prev => prev.map(step => 
                    step.id === stepId 
                        ? { ...step, status: oldStatus || 'pending', completedAt: oldStatus === 'completed' ? step.completedAt : null }
                        : step
                ));
                throw new Error('Failed to update step status');
            }
        } catch (error) {
            // Revert optimistic update if API fails
            setLocalSteps(prev => prev.map(step => 
                step.id === stepId 
                    ? { ...step, status: oldStatus || 'pending', completedAt: oldStatus === 'completed' ? step.completedAt : null }
                    : step
            ));
            toast.error('Failed to update step status. Please try again.');
            console.error('Error updating step status:', error);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        const oldStatus = localGoalStatus;
        
        // Optimistic update - update UI immediately
        setLocalGoalStatus(newStatus);
        
        // Show success toast
        if (newStatus === 'paused') {
            toast.info('Goal paused');
        } else if (newStatus === 'active') {
            toast.success('Goal resumed! 🚀');
        }
        
        try {
            const response = await fetch(`/api/goals/${goal.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                // Revert optimistic update if API fails
                setLocalGoalStatus(oldStatus);
                throw new Error('Failed to update goal');
            }
        } catch (error) {
            // Revert optimistic update if API fails
            setLocalGoalStatus(oldStatus);
            toast.error('Failed to update goal status. Please try again.');
            console.error('Error updating goal:', error);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this goal? This cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/goals/${goal.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete goal');

            router.push('/dashboard');
        } catch (error) {
            console.error('Error deleting goal:', error);
        }
    };

    const handleVisibilityChange = async (newVisibility: string) => {
        const oldVisibility = goal.visibility;
        
        // Set loading state
        setIsUpdatingVisibility(true);
        
        // Optimistic update - update UI immediately
        goal.visibility = newVisibility;
        
        // Show success toast
        if (newVisibility === 'public') {
            toast.success('Goal is now public! 🌍');
        } else {
            toast.info('Goal is now private');
        }
        
        try {
            const response = await fetch(`/api/goals/${goal.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visibility: newVisibility }),
            });

            if (!response.ok) {
                // Revert optimistic update if API fails
                goal.visibility = oldVisibility;
                throw new Error('Failed to update visibility');
            }
        } catch (error) {
            // Revert optimistic update if API fails
            goal.visibility = oldVisibility;
            toast.error('Failed to update visibility. Please try again.');
            console.error('Error updating visibility:', error);
        } finally {
            setIsUpdatingVisibility(false);
        }
    };

    const handleSubStepsCreated = async (stepId: string, subSteps: Array<{
        title: string;
        description: string;
        estimatedTime: string;
    }>) => {
        console.log('Creating sub-steps for step:', stepId, subSteps);
        
        // Ensure subSteps is an array before processing
        if (!Array.isArray(subSteps)) {
            console.error('subSteps is not an array:', subSteps);
            return;
        }
        
        setExpandedSteps(prev => ({
            ...prev,
            [stepId]: subSteps
        }));
        
        // Initialize completion state for new sub-steps
        setSubStepsCompletion(prev => {
            const newCompletion = { ...prev };
            subSteps.forEach((_, idx) => {
                const subStepId = `${stepId}-sub-${idx}`;
                if (!(subStepId in newCompletion)) {
                    newCompletion[subStepId] = false;
                }
            });
            return newCompletion;
        });
        
        console.log('Updated expandedSteps:', expandedSteps);
        console.log('Updated subStepsCompletion:', subStepsCompletion);
    };

    const handleSubStepToggle = (subStepId: string) => {
        setSubStepsCompletion(prev => ({
            ...prev,
            [subStepId]: !prev[subStepId]
        }));
        console.log('Toggled sub-step:', subStepId, 'to:', !subStepsCompletion[subStepId]);
    };

    const daysUntilDeadline = goal.deadline 
        ? Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-muted/50 via-background to-card/50">
            <div className="container mx-auto py-8 px-4 max-w-5xl">
                {/* Back Button */}
                <Link href="/dashboard">
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </Link>

                {/* Header Card */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                    <Badge variant="outline">
                                        {localGoalStatus.charAt(0).toUpperCase() + localGoalStatus.slice(1)}
                                    </Badge>
                                    {goal.deadline && (
                                        <Badge variant={daysUntilDeadline && daysUntilDeadline < 0 ? "destructive" : "secondary"}>
                                            {daysUntilDeadline !== null 
                                                ? daysUntilDeadline < 0 
                                                    ? 'Overdue' 
                                                    : daysUntilDeadline === 0 
                                                        ? 'Due Today' 
                                                        : `${Math.abs(daysUntilDeadline!)} days left`
                                                : ''
                                            }
                                        </Badge>
                                    )}
                                    <Badge 
                                        variant={goal.visibility === 'public' ? "default" : "secondary"}
                                        className={goal.visibility === 'public' ? "bg-primary" : ""}
                                    >
                                        {goal.visibility === 'public' ? (
                                            <><Globe className="h-3 w-3 mr-1" />Public</>
                                        ) : (
                                            <><Lock className="h-3 w-3 mr-1" />Private</>
                                        )}
                                    </Badge>
                                </div>
                                <CardTitle className="text-3xl mb-2">{goal.title}</CardTitle>
                                {goal.why && (
                                    <CardDescription className="text-base flex items-start gap-2 mt-3">
                                        <Heart className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                        <span>{goal.why}</span>
                                    </CardDescription>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Link href={`/check-in?goalId=${goal.id}`}>
                                    <Button variant="outline" size="sm">
                                        <MessageCircle className="mr-2 h-4 w-4" />
                                        Check In
                                    </Button>
                                </Link>
                                {goal.visibility === 'public' ? (
                                    <ShareModal goal={goal} username={user.username || user.id} />
                                ) : (
                                    <Button 
                                        variant="default" 
                                        size="sm"
                                        onClick={() => handleVisibilityChange('public')}
                                        disabled={isUpdatingVisibility}
                                    >
                                        {isUpdatingVisibility ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Globe className="mr-2 h-4 w-4" />
                                        )}
                                        Make Public & Share
                                    </Button>
                                )}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {goal.visibility === 'public' && (
                                            <>
                                                <DropdownMenuItem onClick={() => router.push(`/${user.username || user.id}/goals/${goal.slug}`)}>
                                                    <Share2 className="h-4 w-4 mr-2" />
                                                    View Public Page
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleVisibilityChange('private')} disabled={isUpdatingVisibility}>
                                                    {isUpdatingVisibility ? (
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <Lock className="h-4 w-4 mr-2" />
                                                    )}
                                                    Make Private
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                            </>
                                        )}
                                        {goal.visibility === 'private' && (
                                            <DropdownMenuItem onClick={() => handleVisibilityChange('public')} disabled={isUpdatingVisibility}>
                                                {isUpdatingVisibility ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Globe className="h-4 w-4 mr-2" />
                                                )}
                                                Make Public
                                            </DropdownMenuItem>
                                        )}
                                        {localGoalStatus === 'active' && (
                                            <DropdownMenuItem onClick={() => handleStatusChange('paused')}>
                                                <Pause className="h-4 w-4 mr-2" />
                                                Pause Goal
                                            </DropdownMenuItem>
                                        )}
                                        {localGoalStatus === 'paused' && (
                                            <DropdownMenuItem onClick={() => handleStatusChange('active')}>
                                                <Play className="h-4 w-4 mr-2" />
                                                Resume Goal
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={handleDelete}
                                            className="text-destructive focus:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Goal
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="mt-6 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Overall Progress</span>
                                <span className="font-medium">
                                    {completedSteps}/{totalSteps} steps completed ({Math.round(progressPercent)}%)
                                </span>
                            </div>
                            <Progress value={progressPercent} className="h-3" />
                        </div>

                        {/* Metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
                            {goal.deadline && (
                                <div className="flex items-start gap-2">
                                    <CalendarIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Deadline</p>
                                        <p className="text-sm font-medium">{new Date(goal.deadline).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            )}
                            {goal.timeCommitment && (
                                <div className="flex items-start gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Time Commitment</p>
                                        <p className="text-sm font-medium">{goal.timeCommitment}</p>
                                    </div>
                                </div>
                            )}
                            {goal.biggestConcern && (
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Main Concern</p>
                                        <p className="text-sm font-medium line-clamp-2">{goal.biggestConcern}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                </Card>

                {/* Tabs for organized sections */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4 lg:w-auto">
                        <TabsTrigger value="steps" className="gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Steps
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Analytics
                        </TabsTrigger>
                        <TabsTrigger value="plan" className="gap-2">
                            <FileText className="h-4 w-4" />
                            AI Plan
                        </TabsTrigger>
                        <TabsTrigger value="history" className="gap-2">
                            <History className="h-4 w-4" />
                            History
                        </TabsTrigger>
                    </TabsList>

                    {/* Steps Tab */}
                    <TabsContent value="steps" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Action Steps</CardTitle>
                                <CardDescription>
                                    Check off steps as you complete them
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {localSteps.map((step, index) => (
                                        <div key={step.id}>
                                            <StepItem
                                                step={step}
                                                stepNumber={index + 1}
                                                onToggle={() => handleStepToggle(step.id, step.status)}
                                                disabled={false}
                                                goalTitle={goal.title}
                                                goalContext={{
                                                    deadline: goal.deadline || undefined,
                                                    timeCommitment: goal.timeCommitment || undefined,
                                                    biggestConcern: goal.biggestConcern || undefined,
                                                }}
                                                onSubStepsCreated={handleSubStepsCreated}
                                                onStatusChange={handleStepStatusChange}
                                                onSubStepToggle={handleSubStepToggle}
                                                subSteps={Array.isArray(expandedSteps[step.id]) ? (expandedSteps[step.id] as Array<{ title: string; description: string; estimatedTime: string }>).map((subStep, idx: number) => {
                                                    const subStepId = `${step.id}-sub-${idx}`;
                                                    return {
                                                        id: subStepId,
                                                        title: subStep.title,
                                                        description: subStep.description,
                                                        completed: subStepsCompletion[subStepId] || false,
                                                        orderNum: idx
                                                    };
                                                }) : []}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                        <CoachingSection goalId={goal.id} />
                    </TabsContent>

                    {/* Analytics Tab */}
                    <TabsContent value="analytics">
                        <GoalAnalytics goal={goal} />
                    </TabsContent>

                    {/* AI Plan Tab */}
                    <TabsContent value="plan">
                        {goal.aiPlan && (
                            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-primary" />
                                        Your Personalized AI Plan
                                    </CardTitle>
                                    <CardDescription>
                                        Generated specifically for &quot;{goal.title}&quot; based on your timeline, availability, and concerns
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {/* Overview */}
                                    {goal.aiPlan.overview && (
                                        <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                                            <p className="text-sm leading-relaxed font-medium">{goal.aiPlan.overview}</p>
                                        </div>
                                    )}

                                    {/* Timeline */}
                                    {goal.aiPlan.timeline && (
                                        <div className="mb-6">
                                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-primary" />
                                                Your Timeline
                                            </h3>
                                            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">{goal.aiPlan.timeline}</p>
                                        </div>
                                    )}

                                    {/* Tips */}
                                    {goal.aiPlan.tips && goal.aiPlan.tips.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                                <Lightbulb className="h-4 w-4 text-chart-1" />
                                                Personalized Tips for You
                                            </h3>
                                            <ul className="space-y-2">
                                                {goal.aiPlan.tips.map((tip: string, index: number) => (
                                                    <li key={index} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-muted/30">
                                                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                                        <span>{tip}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history">
                        <CheckInHistory goalId={goal.id} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
