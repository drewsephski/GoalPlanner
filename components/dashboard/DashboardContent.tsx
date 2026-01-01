'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Target, 
  Flame, 
  Trophy,
  Clock,
  CheckCircle2,
  Pause,
  Archive,
  Settings,
  Search,
  SortAsc,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Crown
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GoalCard } from '@/components/dashboard/GoalCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ProBadge } from '@/components/pro/ProBadge';
import { UpgradePrompt } from '@/components/pro/UpgradePrompt';
import { toast } from 'sonner';

interface Goal {
  id: string;
  title: string;
  slug: string;
  status: string;
  visibility: string;
  createdAt: Date;
  updatedAt: Date;
  deadline: string | null;
  steps: Array<{
    id: string;
    status: string;
  }>;
}

interface Stats {
  currentStreak: number;
  longestStreak: number;
  totalStepsCompleted: number;
  totalGoalsCompleted: number;
}

interface DashboardContentProps {
  goals: Goal[];
  stats: Stats;
  subscription?: {
    tier?: string;
    status?: string;
  } | null;
}

export function DashboardContent({ goals, stats, subscription }: DashboardContentProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'paused'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'created' | 'deadline' | 'progress' | 'lastActivity'>('created');

  const isPro = subscription?.tier === 'pro' && subscription?.status === 'active';

  // Calculate goal progress and overdue status
  const goalsWithMetadata = useMemo(() => {
    return goals.map(goal => {
      const totalSteps = goal.steps.length;
      const completedSteps = goal.steps.filter(s => s.status === 'completed').length;
      const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
      
      const isOverdue = goal.deadline && new Date(goal.deadline) < new Date() && goal.status === 'active';
      const daysUntilDeadline = goal.deadline 
        ? Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        ...goal,
        progressPercent,
        isOverdue,
        daysUntilDeadline,
        lastActivity: new Date(goal.updatedAt) // Using updatedAt as proxy for last activity
      };
    });
  }, [goals]);

  // Filter and sort goals
  const filteredAndSortedGoals = useMemo(() => {
    let filtered = goalsWithMetadata.filter(goal => {
      if (filter === 'all') return true;
      return goal.status === filter;
    });

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(goal => 
        goal.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          // Goals without deadline go to the end
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        
        case 'progress':
          return b.progressPercent - a.progressPercent;
        
        case 'lastActivity':
          return b.lastActivity.getTime() - a.lastActivity.getTime();
        
        case 'created':
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });
  }, [goalsWithMetadata, filter, searchQuery, sortBy]);

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const overdueGoals = goalsWithMetadata.filter(g => g.isOverdue);

  const handleDeleteGoal = async (goalId: string, goalTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${goalTitle}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete goal');
      }

      // Refresh the page to show updated goals
      window.location.reload();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/50 via-background to-card/50">
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">Your Goals</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Track your progress and achieve your ambitions
              </p>
            </div>
            {isPro && <ProBadge className="ml-2" />}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Link href="/settings" className="flex-1 sm:flex-none">
              <Button variant="ghost" size="sm" className="w-full sm:w-auto justify-center">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
            <Link href="/analytics" className="flex-1 sm:flex-none">
              <Button variant="ghost" size="sm" className="w-full sm:w-auto justify-center">
                <TrendingUp className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
                <span className="sm:hidden">Stats</span>
              </Button>
            </Link>
            <Link href="/planner" className="flex-1 sm:flex-none">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-chart-2 justify-center">
                <Plus className="mr-2 h-5 w-5" />
                <span className="hidden sm:inline">Create New Goal</span>
                <span className="sm:hidden">New Goal</span>
              </Button>
            </Link>
            {!isPro && (
              <Link href="/pricing" className="flex-1 sm:flex-none">
                <Button variant="outline" size="sm" className="w-full sm:w-auto justify-center border-primary text-primary hover:bg-primary/10">
                  <Crown className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Upgrade to Pro</span>
                  <span className="sm:hidden">Pro</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Search and Sort Controls */}
        {goals.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search goals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Sort */}
            <Select value={sortBy} onValueChange={(value: 'created' | 'deadline' | 'progress' | 'lastActivity') => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SortAsc className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    Created Date
                  </div>
                </SelectItem>
                <SelectItem value="deadline">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    Deadline
                  </div>
                </SelectItem>
                <SelectItem value="progress">
                  <div className="flex items-center">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Progress
                  </div>
                </SelectItem>
                <SelectItem value="lastActivity">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    Last Activity
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Overdue Alert */}
        {overdueGoals.length > 0 && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">
                    {overdueGoals.length} overdue goal{overdueGoals.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Some goals have passed their deadline. Consider updating them.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upgrade Prompt for Free Users with 3+ Goals */}
        {!isPro && activeGoals.length >= 3 && (
          <div className="mb-6">
            <UpgradePrompt
              feature="Unlimited Goals"
              description="You've reached the limit of 3 active goals. Upgrade to Pro to create unlimited goals and unlock advanced features."
            />
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                  <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{stats.currentStreak}</p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{activeGoals.length}</p>
                  <p className="text-xs text-muted-foreground">Active Goals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{stats.totalStepsCompleted}</p>
                  <p className="text-xs text-muted-foreground">Steps Done</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-chart-3/10 rounded-lg">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-chart-3" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{stats.totalGoalsCompleted}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        {goals.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            <Button
              variant={filter === 'active' ? 'default' : 'outline'}
              onClick={() => setFilter('active')}
              size="sm"
              className="flex-shrink-0 touch-action-manipulation"
            >
              <Clock className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Active</span>
              <span className="sm:hidden">({activeGoals.length})</span>
              <span className="hidden sm:inline">({activeGoals.length})</span>
            </Button>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              size="sm"
              className="flex-shrink-0 touch-action-manipulation"
            >
              <span className="hidden sm:inline">All</span>
              <span className="sm:hidden">({goals.length})</span>
              <span className="hidden sm:inline">({goals.length})</span>
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'outline'}
              onClick={() => setFilter('completed')}
              size="sm"
              className="flex-shrink-0 touch-action-manipulation"
            >
              <Trophy className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Completed</span>
              <span className="sm:hidden">({completedGoals.length})</span>
              <span className="hidden sm:inline">({completedGoals.length})</span>
            </Button>
            <Button
              variant={filter === 'paused' ? 'default' : 'outline'}
              onClick={() => setFilter('paused')}
              size="sm"
              className="flex-shrink-0 touch-action-manipulation"
            >
              <Pause className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Paused</span>
              <span className="sm:hidden">Paused</span>
            </Button>
          </div>
        )}

        {/* Goals Grid */}
        {filteredAndSortedGoals.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredAndSortedGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onDelete={handleDeleteGoal} />
            ))}
          </div>
        ) : goals.length > 0 ? (
          <Card className="p-8 sm:p-12">
            <div className="text-center text-muted-foreground">
              <Archive className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm sm:text-base">No {filter} goals found</p>
            </div>
          </Card>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}