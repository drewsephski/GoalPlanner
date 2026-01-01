'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    TrendingUp,
    Clock,
    CheckCircle2,
    Calendar,
    Flame,
    Target,
    BarChart3,
    AlertCircle,
    PieChart,
    Activity
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart as RePieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Area,
    AreaChart
} from 'recharts';

interface Goal {
    id: string;
    title: string;
    status: string;
    startedAt: Date;
    completedAt: Date | null;
    createdAt: Date;
    steps: Array<{
        id: string;
        title: string;
        status: string;
        completedAt: Date | null;
        createdAt: Date;
        dueDate: string | null;
    }>;
}

interface GoalAnalyticsProps {
    goal: Goal;
}

export function GoalAnalytics({ goal }: GoalAnalyticsProps) {
    const currentTime = useMemo(() => new Date(), []);
    
    const totalSteps = goal.steps.length;
    const completedSteps = goal.steps.filter(s => s.status === 'completed').length;
    const inProgressSteps = goal.steps.filter(s => s.status === 'in_progress').length;
    const pendingSteps = goal.steps.filter(s => s.status === 'pending').length;
    const skippedSteps = goal.steps.filter(s => s.status === 'skipped').length;
    
    const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
    
    // Chart data for step status distribution
    const stepStatusData = [
        { name: 'Completed', value: completedSteps, color: '#22c55e' },
        { name: 'In Progress', value: inProgressSteps, color: '#3b82f6' },
        { name: 'Pending', value: pendingSteps, color: '#6b7280' },
        { name: 'Skipped', value: skippedSteps, color: '#f59e0b' },
    ].filter(item => item.value > 0);

    // Chart data for completion timeline
    const completionTimeline = useMemo(() => {
        const sortedSteps = [...goal.steps]
            .filter(s => s.status === 'completed' && s.completedAt)
            .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime());
        
        return sortedSteps.map((step, index) => ({
            step: `Step ${index + 1}`,
            completedDate: new Date(step.completedAt!).toLocaleDateString(),
            daysSinceStart: Math.floor((new Date(step.completedAt!).getTime() - new Date(goal.startedAt).getTime()) / (1000 * 60 * 60 * 24)),
            cumulativeCompleted: index + 1
        }));
    }, [goal.steps, goal.startedAt]);

    // Chart data for progress over time
    const progressOverTime = useMemo(() => {
        const daysSinceStart = Math.floor((currentTime.getTime() - new Date(goal.startedAt).getTime()) / (1000 * 60 * 60 * 24));
        const data = [];
        
        for (let i = 0; i <= daysSinceStart; i++) {
            const targetDate = new Date(goal.startedAt);
            targetDate.setDate(targetDate.getDate() + i);
            
            const stepsCompletedByDate = goal.steps.filter(step => 
                step.status === 'completed' && 
                step.completedAt && 
                new Date(step.completedAt) <= targetDate
            ).length;
            
            data.push({
                day: i + 1,
                date: targetDate.toLocaleDateString(),
                completed: stepsCompletedByDate,
                total: totalSteps
            });
        }
        
        return data;
    }, [goal.steps, goal.startedAt, currentTime, totalSteps]);
    
    // Calculate average time per step (in days)
    const completedStepsWithDates = goal.steps.filter(s => 
        s.status === 'completed' && s.completedAt && s.createdAt
    );
    const avgTimePerStep = completedStepsWithDates.length > 0
        ? completedStepsWithDates.reduce((acc, step) => {
            const created = new Date(step.createdAt).getTime();
            const completed = new Date(step.completedAt!).getTime();
            return acc + (completed - created) / (1000 * 60 * 60 * 24);
        }, 0) / completedStepsWithDates.length
        : 0;

    // Calculate days since goal started
    const daysSinceStart = Math.floor(
        (currentTime.getTime() - new Date(goal.startedAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate completion rate (steps per day)
    const completionRate = daysSinceStart > 0 
        ? (completedSteps / daysSinceStart).toFixed(2)
        : '0.00';

    // Calculate estimated completion date
    const estimatedCompletionDate = useMemo(() => {
        const remainingSteps = totalSteps - completedSteps;
        const estimatedDaysToComplete = avgTimePerStep > 0 
            ? Math.ceil(remainingSteps * avgTimePerStep)
            : null;
        
        return estimatedDaysToComplete
            ? new Date(currentTime.getTime() + estimatedDaysToComplete * 24 * 60 * 60 * 1000)
            : null;
    }, [totalSteps, completedSteps, avgTimePerStep, currentTime]);

    // Check for overdue steps
    const overdueSteps = goal.steps.filter(s => 
        s.status !== 'completed' && 
        s.dueDate && 
        new Date(s.dueDate) < currentTime
    );

    return (
        <div className="space-y-6">
            {/* Progress Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Progress Overview
                    </CardTitle>
                    <CardDescription>
                        Track your overall progress and completion rate
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Main Progress */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Overall Progress</span>
                            <span className="font-semibold text-lg">
                                {Math.round(progressPercent)}%
                            </span>
                        </div>
                        <Progress value={progressPercent} className="h-4" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{completedSteps} of {totalSteps} steps completed</span>
                            <span>{totalSteps - completedSteps} remaining</span>
                        </div>
                    </div>

                    {/* Step Status Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-chart-2/10 rounded-lg border border-chart-2/20">
                            <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-chart-2" />
                            <div className="text-2xl font-bold text-chart-2">{completedSteps}</div>
                            <div className="text-xs text-muted-foreground">Completed</div>
                        </div>
                        <div className="text-center p-4 bg-chart-1/10 rounded-lg border border-chart-1/20">
                            <Target className="h-6 w-6 mx-auto mb-2 text-chart-1" />
                            <div className="text-2xl font-bold text-chart-1">{inProgressSteps}</div>
                            <div className="text-xs text-muted-foreground">In Progress</div>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                            <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                            <div className="text-2xl font-bold">{pendingSteps}</div>
                            <div className="text-xs text-muted-foreground">Pending</div>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                            <div className="h-6 w-6 mx-auto mb-2 text-muted-foreground">⏭️</div>
                            <div className="text-2xl font-bold">{skippedSteps}</div>
                            <div className="text-xs text-muted-foreground">Skipped</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Timeline & Pace */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Timeline & Pace
                    </CardTitle>
                    <CardDescription>
                        Your completion speed and estimated finish date
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Days Since Start */}
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Days Since Start</span>
                            </div>
                            <div className="text-2xl font-bold">{daysSinceStart}</div>
                            <div className="text-xs text-muted-foreground">
                                Started {new Date(goal.startedAt).toLocaleDateString()}
                            </div>
                        </div>

                        {/* Completion Rate */}
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Flame className="h-4 w-4 text-primary" />
                                <span className="text-sm text-muted-foreground">Completion Rate</span>
                            </div>
                            <div className="text-2xl font-bold">{completionRate}</div>
                            <div className="text-xs text-muted-foreground">
                                steps per day
                            </div>
                        </div>

                        {/* Avg Time Per Step */}
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Avg Time Per Step</span>
                            </div>
                            <div className="text-2xl font-bold">
                                {avgTimePerStep > 0 ? `${avgTimePerStep.toFixed(1)}d` : 'N/A'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Based on {completedStepsWithDates.length} completed steps
                            </div>
                        </div>

                        {/* Estimated Completion */}
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Target className="h-4 w-4 text-primary" />
                                <span className="text-sm text-muted-foreground">Est. Completion</span>
                            </div>
                            <div className="text-2xl font-bold">
                                {estimatedCompletionDate 
                                    ? estimatedCompletionDate.toLocaleDateString()
                                    : 'N/A'
                                }
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {estimatedCompletionDate 
                                    ? `~${Math.ceil((estimatedCompletionDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24))} days remaining`
                                    : 'Need more data'
                                }
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Alerts */}
            {(overdueSteps.length > 0 || goal.status === 'paused') && (
                <Card className="border-destructive/50 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {overdueSteps.length > 0 && (
                            <div className="flex items-start gap-3">
                                <Badge variant="destructive" className="mt-0.5">
                                    {overdueSteps.length} Overdue
                                </Badge>
                                <div className="text-sm">
                                    <p className="font-medium">Steps are overdue</p>
                                    <p className="text-muted-foreground">
                                        {overdueSteps.length} step(s) have passed their due date
                                    </p>
                                </div>
                            </div>
                        )}
                        {goal.status === 'paused' && (
                            <div className="flex items-start gap-3">
                                <Badge variant="secondary" className="mt-0.5">
                                    Paused
                                </Badge>
                                <div className="text-sm">
                                    <p className="font-medium">Goal is paused</p>
                                    <p className="text-muted-foreground">
                                        Resume this goal to continue making progress
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Progress Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Step Status Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-5 w-5 text-primary" />
                            Step Status Distribution
                        </CardTitle>
                        <CardDescription>
                            Visual breakdown of your step completion
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stepStatusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <RePieChart>
                                    <Pie
                                        data={stepStatusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#888"
                                        dataKey="value"
                                    >
                                            {stepStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    <Tooltip />
                                </RePieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                No steps completed yet
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Progress Over Time */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Progress Over Time
                        </CardTitle>
                        <CardDescription>
                            Track your completion progress day by day
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {progressOverTime.length > 1 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={progressOverTime}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="day" 
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(value) => `Day ${value}`}
                                    />
                                    <YAxis 
                                        tick={{ fontSize: 12 }}
                                        domain={[0, totalSteps]}
                                    />
                                    <Tooltip 
                                        labelFormatter={(value) => `Day ${value}`}
                                        formatter={(value, name) => [
                                            name === 'completed' ? `${value} steps` : value,
                                            name === 'completed' ? 'Completed' : 'Total'
                                        ]}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="completed"
                                        stroke="#3b82f6"
                                        fill="#3b82f6"
                                        fillOpacity={0.3}
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                Not enough data for timeline
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Completion Timeline */}
            {completionTimeline.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            Completion Timeline
                        </CardTitle>
                        <CardDescription>
                            When you completed each step
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={completionTimeline}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="step" 
                                    tick={{ fontSize: 12 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis 
                                    tick={{ fontSize: 12 }}
                                    label={{ value: 'Days Since Start', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip 
                                    formatter={(value, name) => [
                                        name === 'daysSinceStart' ? `${value} days` : value,
                                        name === 'daysSinceStart' ? 'Days Since Start' : 'Cumulative Completed'
                                    ]}
                                />
                                <Bar dataKey="daysSinceStart" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Insights
                    </CardTitle>
                    <CardDescription>
                        Personalized insights based on your progress
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {progressPercent >= 75 && (
                            <div className="flex items-start gap-3 p-3 bg-chart-2/10 rounded-lg border border-chart-2/20">
                                <CheckCircle2 className="h-5 w-5 text-chart-2 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-medium">Almost there!</p>
                                    <p className="text-muted-foreground">
                                        You&apos;re {Math.round(100 - progressPercent)}% away from completing this goal. Keep pushing!
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        {progressPercent >= 50 && progressPercent < 75 && (
                            <div className="flex items-start gap-3 p-3 bg-chart-1/10 rounded-lg border border-chart-1/20">
                                <Flame className="h-5 w-5 text-chart-1 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-medium">Great progress!</p>
                                    <p className="text-muted-foreground">
                                        You&apos;ve passed the halfway mark. Stay consistent!
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        {progressPercent < 50 && daysSinceStart > 7 && (
                            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                                <Clock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-medium">Keep going!</p>
                                    <p className="text-muted-foreground">
                                        You&apos;ve been working on this goal for {daysSinceStart} days. Focus on completing the next step to build momentum.
                                    </p>
                                </div>
                            </div>
                        )}

                        {avgTimePerStep > 7 && completedSteps >= 3 && (
                            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                                <TrendingUp className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-medium">Consider breaking down steps</p>
                                    <p className="text-muted-foreground">
                                        Your average time per step is {avgTimePerStep.toFixed(1)} days. Breaking large steps into smaller ones might help you complete them faster.
                                    </p>
                                </div>
                            </div>
                        )}

                        {completionRate !== '0.00' && parseFloat(completionRate) > 0.5 && (
                            <div className="flex items-start gap-3 p-3 bg-chart-2/10 rounded-lg border border-chart-2/20">
                                <Flame className="h-5 w-5 text-chart-2 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-medium">Excellent pace!</p>
                                    <p className="text-muted-foreground">
                                        You&apos;re completing {completionRate} steps per day. At this rate, you&apos;ll finish ahead of schedule!
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
