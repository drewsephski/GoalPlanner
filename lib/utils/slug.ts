import { db } from '@/lib/db';
import { goals } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/--+/g, '-') // Replace multiple - with single -
    .slice(0, 50); // Limit length
}

export async function generateSlug(title: string, userId: string): Promise<string> {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let counter = 1;

  // Check if slug exists for this user
  while (true) {
    const existing = await db.query.goals.findFirst({
      where: and(
        eq(goals.userId, userId),
        eq(goals.slug, slug)
      ),
    });

    if (!existing) {
      break;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}