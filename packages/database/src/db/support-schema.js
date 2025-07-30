"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportCannedResponses = exports.supportActivities = exports.supportAttachments = exports.supportMessages = exports.supportTickets = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
// Support tickets table
exports.supportTickets = (0, sqlite_core_1.sqliteTable)('support_tickets', {
    id: (0, sqlite_core_1.text)('id')
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    ticketNumber: (0, sqlite_core_1.text)('ticket_number').notNull().unique(), // Format: TICK-YYYYMMDD-XXXX
    userId: (0, sqlite_core_1.text)('user_id').notNull(),
    userEmail: (0, sqlite_core_1.text)('user_email').notNull(),
    userName: (0, sqlite_core_1.text)('user_name'),
    subject: (0, sqlite_core_1.text)('subject').notNull(),
    description: (0, sqlite_core_1.text)('description').notNull(),
    category: (0, sqlite_core_1.text)('category', {
        enum: ['bug', 'feature_request', 'billing', 'account', 'content', 'technical', 'other'],
    }).notNull(),
    priority: (0, sqlite_core_1.text)('priority', {
        enum: ['low', 'medium', 'high', 'urgent'],
    })
        .notNull()
        .default('medium'),
    status: (0, sqlite_core_1.text)('status', {
        enum: ['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'],
    })
        .notNull()
        .default('open'),
    assignedTo: (0, sqlite_core_1.text)('assigned_to'),
    tags: (0, sqlite_core_1.text)('tags'), // JSON array of tags
    metadata: (0, sqlite_core_1.text)('metadata'), // JSON object for additional data
    createdAt: (0, sqlite_core_1.text)('created_at').default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    updatedAt: (0, sqlite_core_1.text)('updated_at').default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    resolvedAt: (0, sqlite_core_1.text)('resolved_at'),
    closedAt: (0, sqlite_core_1.text)('closed_at'),
    firstResponseAt: (0, sqlite_core_1.text)('first_response_at'),
    satisfactionRating: (0, sqlite_core_1.integer)('satisfaction_rating'),
    satisfactionComment: (0, sqlite_core_1.text)('satisfaction_comment'),
});
// Support ticket messages/replies
exports.supportMessages = (0, sqlite_core_1.sqliteTable)('support_messages', {
    id: (0, sqlite_core_1.text)('id')
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    ticketId: (0, sqlite_core_1.text)('ticket_id').notNull(),
    userId: (0, sqlite_core_1.text)('user_id').notNull(),
    userType: (0, sqlite_core_1.text)('user_type', {
        enum: ['customer', 'support', 'admin', 'system'],
    }).notNull(),
    message: (0, sqlite_core_1.text)('message').notNull(),
    attachments: (0, sqlite_core_1.text)('attachments'), // JSON array of attachment URLs
    isInternalNote: (0, sqlite_core_1.integer)('is_internal_note', { mode: 'boolean' }).default(false),
    createdAt: (0, sqlite_core_1.text)('created_at').default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    updatedAt: (0, sqlite_core_1.text)('updated_at').default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
});
// Support ticket attachments
exports.supportAttachments = (0, sqlite_core_1.sqliteTable)('support_attachments', {
    id: (0, sqlite_core_1.text)('id')
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    ticketId: (0, sqlite_core_1.text)('ticket_id').notNull(),
    messageId: (0, sqlite_core_1.text)('message_id'),
    fileName: (0, sqlite_core_1.text)('file_name').notNull(),
    fileType: (0, sqlite_core_1.text)('file_type').notNull(),
    fileSize: (0, sqlite_core_1.integer)('file_size').notNull(),
    fileUrl: (0, sqlite_core_1.text)('file_url').notNull(),
    uploadedBy: (0, sqlite_core_1.text)('uploaded_by').notNull(),
    uploadedAt: (0, sqlite_core_1.text)('uploaded_at').default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
});
// Support ticket activities/audit log
exports.supportActivities = (0, sqlite_core_1.sqliteTable)('support_activities', {
    id: (0, sqlite_core_1.text)('id')
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    ticketId: (0, sqlite_core_1.text)('ticket_id').notNull(),
    userId: (0, sqlite_core_1.text)('user_id').notNull(),
    activityType: (0, sqlite_core_1.text)('activity_type').notNull(), // status_change, priority_change, assignment, etc.
    description: (0, sqlite_core_1.text)('description').notNull(),
    oldValue: (0, sqlite_core_1.text)('old_value'),
    newValue: (0, sqlite_core_1.text)('new_value'),
    createdAt: (0, sqlite_core_1.text)('created_at').default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
});
// Canned responses for support agents
exports.supportCannedResponses = (0, sqlite_core_1.sqliteTable)('support_canned_responses', {
    id: (0, sqlite_core_1.text)('id')
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    title: (0, sqlite_core_1.text)('title').notNull(),
    content: (0, sqlite_core_1.text)('content').notNull(),
    category: (0, sqlite_core_1.text)('category'),
    tags: (0, sqlite_core_1.text)('tags'), // JSON array
    usageCount: (0, sqlite_core_1.integer)('usage_count').default(0),
    createdBy: (0, sqlite_core_1.text)('created_by').notNull(),
    createdAt: (0, sqlite_core_1.text)('created_at').default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    updatedAt: (0, sqlite_core_1.text)('updated_at').default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
});
