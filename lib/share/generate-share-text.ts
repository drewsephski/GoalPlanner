export function generateShareText(
  goalTitle: string,
  type: 'progress' | 'completion' | 'milestone',
  data: {
    completedSteps?: number;
    totalSteps?: number;
    progressPercent?: number;
    daysSinceStart?: number;
  }
): string {
  if (type === 'completion') {
    return `🎉 I just completed my goal: "${goalTitle}"!\n\nProud of this achievement. What are you working on?`;
  }

  if (type === 'milestone') {
    return `🚀 ${data.progressPercent}% complete on my goal: "${goalTitle}"\n\nThe journey continues! ${data.completedSteps}/${data.totalSteps} steps done.`;
  }

  return `💪 Making progress on: "${goalTitle}"\n\n${data.completedSteps}/${data.totalSteps} steps complete (Day ${data.daysSinceStart})\n\nWhat goals are you working towards?`;
}

export function generateShareLinks(
  text: string,
  url: string
): {
  twitter: string;
  linkedin: string;
  facebook: string;
} {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);

  return {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
  };
}