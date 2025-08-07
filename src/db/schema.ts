import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, primaryKey, text, timestamp, jsonb, real } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { AdapterAccountType } from 'next-auth/adapters';

export const users = pgTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  password: text('password'),
});

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export const accounts = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  }),
);

export const authenticators = pgTable(
  'authenticator',
  {
    credentialID: text('credentialID').notNull().unique(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    providerAccountId: text('providerAccountId').notNull(),
    credentialPublicKey: text('credentialPublicKey').notNull(),
    counter: integer('counter').notNull(),
    credentialDeviceType: text('credentialDeviceType').notNull(),
    credentialBackedUp: boolean('credentialBackedUp').notNull(),
    transports: text('transports'),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  }),
);

export const projects = pgTable('project', {
  id: text('id').primaryKey().$defaultFn(createId),
  name: text('name').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, {
      onDelete: 'cascade',
    }),
  json: text('json').notNull(),
  height: integer('height').notNull(),
  width: integer('width').notNull(),
  thumbnailUrl: text('thumbnailUrl'),
  isTemplate: boolean('isTemplate').$defaultFn(() => false),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
});

export const projectsRelations = relations(projects, ({ one }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
}));

export const projectsInsertSchema = createInsertSchema(projects);

// AI Resize Training Data Tables
export const resizeSessions = pgTable('resize_session', {
  id: text('id').primaryKey().$defaultFn(createId),
  userId: text('userId').references(() => users.id, { onDelete: 'cascade' }),
  projectId: text('projectId').references(() => projects.id, { onDelete: 'set null' }), // Don't cascade delete
  originalCanvas: jsonb('originalCanvas').notNull(),
  targetDimensions: jsonb('targetDimensions').notNull(),
  aiResult: jsonb('aiResult').notNull(),
  userRating: integer('userRating'), // 1-5 stars, add constraint
  feedbackText: text('feedbackText'),
  manualCorrections: jsonb('manualCorrections'),
  processingTime: integer('processingTime'), // milliseconds, add constraint
  variantId: text('variantId'), // Track A/B test variant
  status: text('status').notNull().$defaultFn(() => 'completed'), // completed, failed, pending
  errorMessage: text('errorMessage'), // Store error details
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
});

export const trainingData = pgTable('training_data', {
  id: text('id').primaryKey().$defaultFn(createId),
  sessionId: text('sessionId').notNull().references(() => resizeSessions.id, { onDelete: 'cascade' }),
  inputFeatures: jsonb('inputFeatures').notNull(), // Canvas analysis features
  expectedOutput: jsonb('expectedOutput').notNull(), // Ideal positioning/scaling
  qualityScore: real('qualityScore').notNull(), // 0.0-1.0 based on user feedback
  validated: boolean('validated').notNull().$defaultFn(() => false),
  validatedBy: text('validatedBy'), // Track who validated
  validatedAt: timestamp('validatedAt', { mode: 'date' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
});

export const resizeSessionsRelations = relations(resizeSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [resizeSessions.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [resizeSessions.projectId],
    references: [projects.id],
  }),
  trainingData: many(trainingData),
}));

export const trainingDataRelations = relations(trainingData, ({ one }) => ({
  session: one(resizeSessions, {
    fields: [trainingData.sessionId],
    references: [resizeSessions.id],
  }),
}));

export const resizeSessionsInsertSchema = createInsertSchema(resizeSessions);
export const trainingDataInsertSchema = createInsertSchema(trainingData);

