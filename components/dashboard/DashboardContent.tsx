'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  Target, 
  Flame, 
  Trophy,
  Clock,
  CheckCircle2,
  Pause,
  Archive,
  Settings
} from 'lucide-react';
import { GoalCard } from '@/components/dashboard/GoalCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { toast } from 'sonner';

interface Goal {
  id: string;
  title: string;
  slug: string;
  status: string;
  visibility: string;
  createdAt: Date;
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
}

export function DashboardContent({ goals, stats }: DashboardContentProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'paused'>('active');

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

  const filteredGoals = goals.filter(goal => {
    if (filter === 'all') return true;
    return goal.status === filter;
  });

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/50 via-background to-card/50">
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Your Goals</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Track your progress and achieve your ambitions
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Link href="/settings" className="flex-1 sm:flex-none">
              <Button variant="ghost" size="sm" className="w-full sm:w-auto justify-center">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
            <Link href="/planner" className="flex-1 sm:flex-none">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-chart-2 justify-center">
                <Plus className="mr-2 h-5 w-5" />
                <span className="hidden sm:inline">Create New Goal</span>
                <span className="sm:hidden">New Goal</span>
              </Button>
            </Link>
          </div>
        </div>

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
        {filteredGoals.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredGoals.map((goal) => (
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