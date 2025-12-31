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
  Archive
} from 'lucide-react';
import { GoalCard } from '@/components/dashboard/GoalCard';
import { EmptyState } from '@/components/dashboard/EmptyState';

interface Goal {
  id: string;
  title: string;
  slug: string;
  status: string;
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

  const filteredGoals = goals.filter(goal => {
    if (filter === 'all') return true;
    return goal.status === filter;
  });

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/50 via-background to-card/50">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Your Goals</h1>
            <p className="text-muted-foreground">
              Track your progress and achieve your ambitions
            </p>
          </div>
          <Link href="/planner">
            <Button size="lg" className="bg-gradient-to-r from-primary to-chart-2">
              <Plus className="mr-2 h-5 w-5" />
              Create New Goal
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Flame className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.currentStreak}</p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-chart-1/10 rounded-lg">
                  <Target className="h-5 w-5 text-chart-1" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeGoals.length}</p>
                  <p className="text-xs text-muted-foreground">Active Goals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-chart-2/10 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalStepsCompleted}</p>
                  <p className="text-xs text-muted-foreground">Steps Done</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-chart-3/10 rounded-lg">
                  <Trophy className="h-5 w-5 text-chart-3" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalGoalsCompleted}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        {goals.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <Button
              variant={filter === 'active' ? 'default' : 'outline'}
              onClick={() => setFilter('active')}
              size="sm"
            >
              <Clock className="mr-2 h-4 w-4" />
              Active ({activeGoals.length})
            </Button>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              size="sm"
            >
              All ({goals.length})
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'outline'}
              onClick={() => setFilter('completed')}
              size="sm"
            >
              <Trophy className="mr-2 h-4 w-4" />
              Completed ({completedGoals.length})
            </Button>
            <Button
              variant={filter === 'paused' ? 'default' : 'outline'}
              onClick={() => setFilter('paused')}
              size="sm"
            >
              <Pause className="mr-2 h-4 w-4" />
              Paused
            </Button>
          </div>
        )}

        {/* Goals Grid */}
        {filteredGoals.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        ) : goals.length > 0 ? (
          <Card className="p-12">
            <div className="text-center text-muted-foreground">
              <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No {filter} goals found</p>
            </div>
          </Card>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}