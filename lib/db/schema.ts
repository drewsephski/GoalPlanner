import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, date, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (synced from Clerk)
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  email: text('email').notNull(),
  username: text('username').unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  usernameIdx: index('users_username_idx').on(table.username),
}));

// Goals table
export const goals = pgTable('goals', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Goal details
  title: text('title').notNull(),
  slug: text('slug').notNull(), // for public URLs
  why: text('why'), // Why this matters to user
  deadline: date('deadline'),
  timeCommitment: text('time_commitment'), // "2 hours/week"
  biggestConcern: text('biggest_concern'),
  
  // AI-generated plan
  aiPlan: jsonb('ai_plan').$type<{
    overview: string;
    steps: Array<{
      title: string;
      description: string;
      order: number;
    }>;
    timeline: string;
    tips: string[];
  }>(),
  
  // Status
  status: text('status').notNull().default('active'), // active, paused, completed, abandoned
  visibility: text('visibility').notNull().default('public'), // private, public, unlisted
  
  // Timestamps
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('goals_user_id_idx').on(table.userId),
  slugIdx: uniqueIndex('goals_slug_idx').on(table.slug),
  statusIdx: index('goals_status_idx').on(table.status),
  visibilityIdx: index('goals_visibility_idx').on(table.visibility),
}));

// Steps table
export const steps = pgTable('steps', {
  id: uuid('id').defaultRandom().primaryKey(),
  goalId: uuid('goal_id').notNull().references(() => goals.id, { onDelete: 'cascade' }),
  
  orderNum: integer('order_num').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: date('due_date'),
  
  status: text('status').notNull().default('pending'), // pending, in_progress, completed, skipped
  
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  goalIdIdx: index('steps_goal_id_idx').on(table.goalId),
  statusIdx: index('steps_status_idx').on(table.status),
}));

// Check-ins table (the viral engine)
export const checkIns = pgTable('check_ins', {
  id: uuid('id').defaultRandom().primaryKey(),
  goalId: uuid('goal_id').notNull().references(() => goals.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  type: text('type').notNull(), // daily, weekly, step_completion, milestone
  mood: text('mood'), // great, good, struggling, stuck
  content: text('content'), // User's reflection
  imageUrl: text('image_url'), // Progress photo URL
  
  isPublic: boolean('is_public').notNull().default(false),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  goalIdIdx: index('checkins_goal_id_idx').on(table.goalId),
  userIdIdx: index('checkins_user_id_idx').on(table.userId),
  publicIdx: index('checkins_public_idx').on(table.isPublic),
}));

// Achievements table
export const achievements = pgTable('achievements', {
  id: text('id').primaryKey(), // e.g., 'first_step', 'week_warrior'
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(), // emoji
  tier: text('tier').notNull(), // bronze, silver, gold, diamond
  sortOrder: integer('sort_order').notNull(),
});

// User achievements (unlocked badges)
export const userAchievements = pgTable('user_achievements', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  achievementId: text('achievement_id').notNull().references(() => achievements.id),
  unlockedAt: timestamp('unlocked_at').defaultNow().notNull(),
}, (table) => ({
  pk: uniqueIndex('user_achievements_pk').on(table.userId, table.achievementId),
  userIdIdx: index('user_achievements_user_id_idx').on(table.userId),
}));

// Goal reactions (emojis on check-ins)
export const goalReactions = pgTable('goal_reactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  goalId: uuid('goal_id').references(() => goals.id, { onDelete: 'cascade' }),
  checkInId: uuid('check_in_id').references(() => checkIns.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  emoji: text('emoji').notNull(), // 🔥, 💪, 🎉, 👏
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueReaction: uniqueIndex('unique_reaction').on(table.userId, table.checkInId, table.emoji),
}));

// User stats (for gamification)
export const userStats = pgTable('user_stats', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  totalStepsCompleted: integer('total_steps_completed').notNull().default(0),
  totalGoalsCompleted: integer('total_goals_completed').notNull().default(0),
  lastActivityDate: date('last_activity_date'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Subscriptions table
export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(), // Polar subscription ID
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  status: text('status').notNull(), // active, canceled, past_due, trialing
  tier: text('tier').notNull(), // free, pro
  
  // Polar data
  polarCustomerId: text('polar_customer_id'),
  polarSubscriptionId: text('polar_subscription_id'),
  polarProductId: text('polar_product_id'),
  
  // Billing
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('subscriptions_user_id_idx').on(table.userId),
  statusIdx: index('subscriptions_status_idx').on(table.status),
}));

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  goals: many(goals),
  checkIns: many(checkIns),
  stats: one(userStats),
  subscription: one(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id],
  }),
  steps: many(steps),
  checkIns: many(checkIns),
}));

export const stepsRelations = relations(steps, ({ one }) => ({
  goal: one(goals, {
    fields: [steps.goalId],
    references: [goals.id],
  }),
}));

export const checkInsRelations = relations(checkIns, ({ one, many }) => ({
  goal: one(goals, {
    fields: [checkIns.goalId],
    references: [goals.id],
  }),
  user: one(users, {
    fields: [checkIns.userId],
    references: [users.id],
  }),
  reactions: many(goalReactions),
}));