import Image from 'next/image';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Share2,
  Twitter,
  Linkedin,
  Facebook,
  Link as LinkIcon,
  Check,
  Download
} from 'lucide-react';
import { generateShareText, generateShareLinks } from '@/lib/share/generate-share-text';

interface ShareModalProps {
  goal: {
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
  };
  username: string;
}

export function ShareModal({ goal, username }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const totalSteps = goal.steps.length;
  const completedSteps = goal.steps.filter((s: { status: string }) => s.status === 'completed').length;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const daysSinceStart = Math.floor(
    (new Date().getTime() - new Date(goal.startedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const shareType = goal.status === 'completed' ? 'completion' : 'progress';
  const shareText = generateShareText(goal.title, shareType, {
    completedSteps,
    totalSteps,
    progressPercent,
    daysSinceStart,
  });

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${username}/goals/${goal.slug}`;
  const shareLinks = generateShareLinks(shareText, publicUrl);
  const cardUrl = `/api/share/generate-card?goalId=${goal.id}&type=${shareType}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadCard = () => {
    const link = document.createElement('a');
    link.href = cardUrl;
    link.download = `${goal.slug}-progress.png`;
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          Share Progress
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share Your Progress</DialogTitle>
          <DialogDescription>
            Let others see your journey and inspire them to start their own goals
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview Card */}
          <div className="relative rounded-lg overflow-hidden border-2">
            <Image
              src={cardUrl}
              alt="Share card preview"
              width={600}
              height={315}
              className="w-full"
            />
          </div>

          {/* Share Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share text:</label>
            <div className="p-3 bg-muted rounded-lg text-sm">
              {shareText}
            </div>
          </div>

          {/* Share Buttons */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Share on:</label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => window.open(shareLinks.twitter, '_blank')}
                className="w-full"
              >
                <Twitter className="mr-2 h-4 w-4" />
                Twitter
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(shareLinks.linkedin, '_blank')}
                className="w-full"
              >
                <Linkedin className="mr-2 h-4 w-4" />
                LinkedIn
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(shareLinks.facebook, '_blank')}
                className="w-full"
              >
                <Facebook className="mr-2 h-4 w-4" />
                Facebook
              </Button>
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="w-full"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-chart-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Download Card */}
          <Button
            variant="outline"
            onClick={handleDownloadCard}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}