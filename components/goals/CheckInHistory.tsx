'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2,
  Calendar,
  Smile,
  Meh,
  Frown
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CheckIn {
  id: string;
  type: string;
  mood: string | null;
  content: string | null;
  createdAt: Date;
}

interface CheckInHistoryProps {
  goalId: string;
}

const MOOD_CONFIG = {
  great: { icon: Smile, color: 'text-chart-2', bg: 'bg-chart-2/10' },
  good: { icon: Smile, color: 'text-chart-1', bg: 'bg-chart-1/10' },
  struggling: { icon: Meh, color: 'text-chart-4', bg: 'bg-chart-4/10' },
  stuck: { icon: Frown, color: 'text-destructive', bg: 'bg-destructive/10' },
};

export function CheckInHistory({ goalId }: CheckInHistoryProps) {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCheckIns = async () => {
      try {
        const response = await fetch(`/api/check-ins?goalId=${goalId}`);
        if (!response.ok) throw new Error('Failed to fetch check-ins');
        
        const data = await response.json();
        setCheckIns(data.checkIns);
      } catch (error) {
        console.error('Error fetching check-ins:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCheckIns();
  }, [goalId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (checkIns.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Check-In History
        </CardTitle>
        <CardDescription>
          Your progress journal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {checkIns.map((checkIn) => {
            const moodConfig = checkIn.mood ? MOOD_CONFIG[checkIn.mood as keyof typeof MOOD_CONFIG] : null;
            const MoodIcon = moodConfig?.icon;

            return (
              <div
                key={checkIn.id}
                className="flex gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                {/* Mood Icon */}
                {moodConfig && MoodIcon && (
                  <div className={`w-10 h-10 rounded-full ${moodConfig.bg} flex items-center justify-center flex-shrink-0`}>
                    <MoodIcon className={`w-5 h-5 ${moodConfig.color}`} />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {checkIn.mood && (
                      <Badge variant="outline" className="capitalize">
                        {checkIn.mood}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(checkIn.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  
                  {checkIn.content && (
                    <p className="text-sm leading-relaxed">
                      {checkIn.content}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}