import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Support tickets table
export const supportTickets = sqliteTable('support_tickets', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  ticketNumber: text('ticket_number').notNull().unique(), // Format: TICK-YYYYMMDD-XXXX
  userId: text('user_id').notNull(),
  userEmail: text('user_email').notNull(),
  userName: text('user_name'),
  subject: text('subject').notNull(),
  description: text('description').notNull(),
  category: text('category', {
    enum: ['bug', 'feature_request', 'billing', 'account', 'content', 'technical', 'other'],
  }).notNull(),
  priority: text('priority', {
    enum: ['low', 'medium', 'high', 'urgent'],
  })
    .notNull()
    .default('medium'),
  status: text('status', {
    enum: ['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'],
  })
    .notNull()
    .default('open'),
  assignedTo: text('assigned_to'),
  tags: text('tags'), // JSON array of tags
  metadata: text('metadata'), // JSON object for additional data
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  resolvedAt: text('resolved_at'),
  closedAt: text('closed_at'),
  firstResponseAt: text('first_response_at'),
  satisfactionRating: integer('satisfaction_rating'),
  satisfactionComment: text('satisfaction_comment'),
});

// Support ticket messages/replies
export const supportMessages = sqliteTable('support_messages', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  ticketId: text('ticket_id').notNull(),
  userId: text('user_id').notNull(),
  userType: text('user_type', {
    enum: ['customer', 'support', 'admin', 'system'],
  }).notNull(),
  message: text('message').notNull(),
  attachments: text('attachments'), // JSON array of attachment URLs
  isInternalNote: integer('is_internal_note', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Support ticket attachments
export const supportAttachments = sqliteTable('support_attachments', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  ticketId: text('ticket_id').notNull(),
  messageId: text('message_id'),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size').notNull(),
  fileUrl: text('file_url').notNull(),
  uploadedBy: text('uploaded_by').notNull(),
  uploadedAt: text('uploaded_at').default(sql`CURRENT_TIMESTAMP`),
});

// Support ticket activities/audit log
export const supportActivities = sqliteTable('support_activities', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  ticketId: text('ticket_id').notNull(),
  userId: text('user_id').notNull(),
  activityType: text('activity_type').notNull(), // status_change, priority_change, assignment, etc.
  description: text('description').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Canned responses for support agents
export const supportCannedResponses = sqliteTable('support_canned_responses', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category'),
  tags: text('tags'), // JSON array
  usageCount: integer('usage_count').default(0),
  createdBy: text('created_by').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Type exports
export type SupportTicket = typeof supportTickets.$inferSelect;
export type NewSupportTicket = typeof supportTickets.$inferInsert;
export type SupportMessage = typeof supportMessages.$inferSelect;
export type NewSupportMessage = typeof supportMessages.$inferInsert;
export type SupportAttachment = typeof supportAttachments.$inferSelect;
export type NewSupportAttachment = typeof supportAttachments.$inferInsert;
export type SupportActivity = typeof supportActivities.$inferSelect;
export type NewSupportActivity = typeof supportActivities.$inferInsert;
export type SupportCannedResponse = typeof supportCannedResponses.$inferSelect;
export type NewSupportCannedResponse = typeof supportCannedResponses.$inferInsert;