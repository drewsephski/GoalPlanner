import { Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ProBadge({ className }: { className?: string }) {
  return (
    <Badge 
      className={`bg-gradient-to-r from-primary to-chart-2 text-primary-foreground border-0 ${className}`}
    >
      <Crown className="w-3 h-3 mr-1" />
      PRO
    </Badge>
  );
}
