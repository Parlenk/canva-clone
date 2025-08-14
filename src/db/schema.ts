import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import { integer, sqliteTable, primaryKey, text, real } from 'drizzle-orm/sqlite-core';
import { createInsertSchema } from 'drizzle-zod';
import type { AdapterAccountType } from 'next-auth/adapters';

export const users = sqliteTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: integer('emailVerified', { mode: 'timestamp' }),
  image: text('image'),
  password: text('password'),
});

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export const accounts = sqliteTable(
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

export const sessions = sqliteTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
});

export const verificationTokens = sqliteTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: integer('expires', { mode: 'timestamp' }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  }),
);

export const authenticators = sqliteTable(
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
    credentialBackedUp: integer('credentialBackedUp', { mode: 'boolean' }).notNull(),
    transports: text('transports'),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  }),
);

export const projects = sqliteTable('project', {
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
  isTemplate: integer('isTemplate', { mode: 'boolean' }).$defaultFn(() => false),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});

export const projectsRelations = relations(projects, ({ one }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
}));

export const projectsInsertSchema = createInsertSchema(projects);

// AI Resize Training Data Tables
export const resizeSessions = sqliteTable('resize_session', {
  id: text('id').primaryKey().$defaultFn(createId),
  userId: text('userId').references(() => users.id, { onDelete: 'cascade' }),
  projectId: text('projectId').references(() => projects.id, { onDelete: 'set null' }), // Don't cascade delete
  originalCanvas: text('originalCanvas').notNull(),
  targetDimensions: text('targetDimensions').notNull(),
  aiResult: text('aiResult').notNull(),
  userRating: integer('userRating'), // 1-5 stars, add constraint
  feedbackText: text('feedbackText'),
  manualCorrections: text('manualCorrections'),
  processingTime: integer('processingTime'), // milliseconds, add constraint
  variantId: text('variantId'), // Track A/B test variant
  status: text('status').notNull().$defaultFn(() => 'completed'), // completed, failed, pending
  errorMessage: text('errorMessage'), // Store error details
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const trainingData = sqliteTable('training_data', {
  id: text('id').primaryKey().$defaultFn(createId),
  sessionId: text('sessionId').notNull().references(() => resizeSessions.id, { onDelete: 'cascade' }),
  inputFeatures: text('inputFeatures').notNull(), // Canvas analysis features
  expectedOutput: text('expectedOutput').notNull(), // Ideal positioning/scaling
  qualityScore: real('qualityScore').notNull(), // 0.0-1.0 based on user feedback
  validated: integer('validated', { mode: 'boolean' }).notNull().$defaultFn(() => false),
  validatedBy: text('validatedBy'), // Track who validated
  validatedAt: integer('validatedAt', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
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