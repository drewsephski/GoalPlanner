'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp,
  Target,
  Calendar,
  Activity,
  BarChart3
} from 'lucide-react';
import { 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, eachWeekOfInterval, subDays } from 'date-fns';

interface Goal {
  id: string;
  title: string;
  status: string;
  startedAt: Date | string;
  completedAt?: Date | string | null;
  steps: Step[];
}

interface Step {
  id: string;
  status: string;
}

interface CheckIn {
  id: string;
  createdAt: Date | string;
  mood?: string | null;
  content?: string | null;
}

interface AnalyticsDashboardProps {
  goals: Goal[];
  checkIns: CheckIn[];
}

const MOOD_COLORS = {
  great: '#22c55e',
  good: '#3b82f6',
  struggling: '#f59e0b',
  stuck: '#ef4444',
};

export function AnalyticsDashboard({ goals, checkIns }: AnalyticsDashboardProps) {
  // Calculate metrics
  const totalGoals = goals.length;
  const activeGoals = goals.filter(g => g.status === 'active').length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  const completedSteps = goals.reduce(
    (acc, g) => acc + g.steps.filter((s: Step) => s.status === 'completed').length, 
    0
  );

  // Check-in frequency (last 4 weeks)
  const fourWeeksAgo = subDays(new Date(), 28);
  const weeks = eachWeekOfInterval({
    start: fourWeeksAgo,
    end: new Date(),
  });

  const checkInsByWeek = weeks.map(weekStart => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const count = checkIns.filter(ci => {
      const ciDate = new Date(ci.createdAt);
      return ciDate >= weekStart && ciDate < weekEnd;
    }).length;

    return {
      week: format(weekStart, 'MMM d'),
      checkIns: count,
    };
  });

  // Mood distribution
  const moodCounts = checkIns.reduce((acc, ci) => {
    if (ci.mood) {
      acc[ci.mood] = (acc[ci.mood] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const moodData = Object.entries(moodCounts).map(([mood, count]) => ({
    name: mood.charAt(0).toUpperCase() + mood.slice(1),
    value: count,
    color: MOOD_COLORS[mood as keyof typeof MOOD_COLORS],
  }));

  // Goal progress over time
  const goalsWithProgress = goals.map(goal => {
    const total = goal.steps.length;
    const completed = goal.steps.filter((s: Step) => s.status === 'completed').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      name: goal.title.length > 30 ? goal.title.slice(0, 30) + '...' : goal.title,
      progress,
    };
  }).filter(g => g.progress > 0 && g.progress < 100); // Only show in-progress goals

  // Average completion time
  const completedGoalsWithTime = goals
    .filter(g => g.status === 'completed' && g.completedAt)
    .map(g => {
      const days = Math.floor(
        (new Date(g.completedAt!).getTime() - new Date(g.startedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      return days;
    });

  const avgCompletionDays = completedGoalsWithTime.length > 0
    ? Math.round(completedGoalsWithTime.reduce((a, b) => a + b, 0) / completedGoalsWithTime.length)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/50 via-background to-card/50">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Deep insights into your goal achievement journey
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeGoals}</p>
                  <p className="text-xs text-muted-foreground">Active Goals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-chart-2/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completionRate}%</p>
                  <p className="text-xs text-muted-foreground">Completion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-chart-1/10 rounded-lg">
                  <Activity className="h-5 w-5 text-chart-1" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedSteps}</p>
                  <p className="text-xs text-muted-foreground">Steps Done</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-chart-4/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-chart-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{avgCompletionDays}</p>
                  <p className="text-xs text-muted-foreground">Avg. Days to Complete</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Check-in Frequency */}
          <Card>
            <CardHeader>
              <CardTitle>Check-In Activity (Last 4 Weeks)</CardTitle>
              <CardDescription>
                Your consistency in checking in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={checkInsByWeek}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="week" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="checkIns" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Mood Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Mood Distribution</CardTitle>
              <CardDescription>
                How you&apos;ve been feeling about your goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {moodData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={moodData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {moodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No mood data yet. Start checking in!
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Goal Progress */}
        {goalsWithProgress.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Goals in Progress</CardTitle>
              <CardDescription>
                Current completion status of your active goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(300, goalsWithProgress.length * 60)}>
                <BarChart data={goalsWithProgress} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis type="number" domain={[0, 100]} fontSize={12} />
                  <YAxis type="category" dataKey="name" width={200} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="progress" fill="#ec4899" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Insights */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {checkIns.length < 5 && (
              <div className="p-4 bg-chart-1/10 rounded-lg border border-chart-1/20">
                <p className="font-medium mb-1">📊 Check in more frequently</p>
                <p className="text-sm text-muted-foreground">
                  Regular check-ins help you stay accountable. Try checking in at least once a week!
                </p>
              </div>
            )}

            {completionRate < 30 && totalGoals > 2 && (
              <div className="p-4 bg-chart-4/10 rounded-lg border border-chart-4/20">
                <p className="font-medium mb-1">🎯 Focus on completion</p>
                <p className="text-sm text-muted-foreground">
                  You have {activeGoals} active goals. Consider focusing on 1-2 goals at a time for better completion rates.
                </p>
              </div>
            )}

            {moodCounts.struggling > moodCounts.great && (
              <div className="p-4 bg-chart-2/10 rounded-lg border border-chart-2/20">
                <p className="font-medium mb-1">💪 You&apos;ve been struggling</p>
                <p className="text-sm text-muted-foreground">
                  Talk to your AI coach about adjusting your goals or timeline. It&apos;s okay to adapt your plan!
                </p>
              </div>
            )}

            {avgCompletionDays > 0 && avgCompletionDays < 30 && (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="font-medium mb-1">⚡ Fast achiever!</p>
                <p className="text-sm text-muted-foreground">
                  You complete goals in an average of {avgCompletionDays} days. Consider setting more ambitious goals!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
