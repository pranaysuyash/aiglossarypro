import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod';
import { users } from './schema';

// A/B Test definition table
export const abTests = pgTable(
  'ab_tests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),

    // Test configuration
    testType: varchar('test_type', { length: 50 }).notNull().default('landing_background'),
    variants: jsonb('variants').notNull().$type<string[]>(), // ['neural', 'code', 'geometric', 'default']
    trafficSplit: jsonb('traffic_split').$type<Record<string, number>>(), // { 'neural': 0.25, 'code': 0.25, ... }

    // Test parameters
    successMetric: varchar('success_metric', { length: 100 }).notNull(), // 'trial_signup', 'cta_click'
    minimumSampleSize: integer('minimum_sample_size').default(1000),
    confidenceThreshold: real('confidence_threshold').default(0.95),

    // Test status
    status: varchar('status', { length: 20 }).notNull().default('draft'), // draft, active, paused, completed
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),

    // Results
    winner: varchar('winner', { length: 100 }),
    winnerConfidence: real('winner_confidence'),
    finalResults: jsonb('final_results'),

    // Metadata
    createdBy: varchar('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    statusIdx: index('ab_tests_status_idx').on(table.status),
    typeIdx: index('ab_tests_type_idx').on(table.testType),
    dateIdx: index('ab_tests_date_idx').on(table.startDate, table.endDate),
  })
);

// A/B Test metrics aggregation table
export const abTestMetrics = pgTable(
  'ab_test_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    testId: uuid('test_id')
      .notNull()
      .references(() => abTests.id, { onDelete: 'cascade' }),
    variant: varchar('variant', { length: 100 }).notNull(),

    // Core metrics
    pageViews: integer('page_views').notNull().default(0),
    uniqueVisitors: integer('unique_visitors').notNull().default(0),
    totalSessions: integer('total_sessions').notNull().default(0),

    // Conversion funnel
    seeWhatsInsideClicks: integer('see_whats_inside_clicks').notNull().default(0),
    ctaClicks: integer('cta_clicks').notNull().default(0),
    trialSignups: integer('trial_signups').notNull().default(0),
    newsletterSignups: integer('newsletter_signups').notNull().default(0),
    pricingPageViews: integer('pricing_page_views').notNull().default(0),

    // Engagement metrics
    bounceRate: real('bounce_rate').default(0),
    avgSessionDuration: real('avg_session_duration').default(0), // in seconds
    avgScrollDepth: real('avg_scroll_depth').default(0), // percentage

    // Device and browser breakdown
    deviceBreakdown: jsonb('device_breakdown').$type<Record<string, number>>().default({}),
    browserBreakdown: jsonb('browser_breakdown').$type<Record<string, number>>().default({}),

    // UTM tracking
    utmSourceBreakdown: jsonb('utm_source_breakdown').$type<Record<string, number>>().default({}),
    utmMediumBreakdown: jsonb('utm_medium_breakdown').$type<Record<string, number>>().default({}),

    // Time-based metrics
    hourlyDistribution: jsonb('hourly_distribution').$type<Record<number, number>>().default({}),
    dayOfWeekDistribution: jsonb('day_of_week_distribution')
      .$type<Record<string, number>>()
      .default({}),

    // Statistical data
    conversionRate: real('conversion_rate').default(0),
    confidenceInterval: jsonb('confidence_interval').$type<{ lower: number; upper: number }>(),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    testVariantUnique: unique().on(table.testId, table.variant),
    testIdIdx: index('ab_test_metrics_test_idx').on(table.testId),
    variantIdx: index('ab_test_metrics_variant_idx').on(table.variant),
  })
);

// A/B Test events table - raw event data
export const abTestEvents = pgTable(
  'ab_test_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    testId: uuid('test_id')
      .notNull()
      .references(() => abTests.id, { onDelete: 'cascade' }),
    variant: varchar('variant', { length: 100 }).notNull(),

    // Event details
    eventType: varchar('event_type', { length: 100 }).notNull(), // 'page_view', 'cta_click', 'conversion'
    eventName: varchar('event_name', { length: 200 }),
    properties: jsonb('properties').default({}),

    // Session info
    sessionId: varchar('session_id', { length: 100 }),
    userId: varchar('user_id', { length: 100 }),

    // Context
    deviceType: varchar('device_type', { length: 20 }),
    browser: varchar('browser', { length: 50 }),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    referrer: text('referrer'),

    // UTM parameters
    utmSource: varchar('utm_source', { length: 100 }),
    utmMedium: varchar('utm_medium', { length: 100 }),
    utmCampaign: varchar('utm_campaign', { length: 100 }),

    timestamp: timestamp('timestamp').defaultNow(),
  },
  (table) => ({
    testIdIdx: index('ab_test_events_test_idx').on(table.testId),
    variantIdx: index('ab_test_events_variant_idx').on(table.variant),
    eventTypeIdx: index('ab_test_events_type_idx').on(table.eventType),
    timestampIdx: index('ab_test_events_timestamp_idx').on(table.timestamp),
    sessionIdx: index('ab_test_events_session_idx').on(table.sessionId),
  })
);

// A/B Test reports table
export const abTestReports = pgTable(
  'ab_test_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    testId: uuid('test_id')
      .notNull()
      .references(() => abTests.id, { onDelete: 'cascade' }),

    // Report details
    reportType: varchar('report_type', { length: 50 }).notNull(), // 'daily', 'weekly', 'final'
    reportDate: timestamp('report_date').notNull(),

    // Metrics snapshot
    metricsSnapshot: jsonb('metrics_snapshot').notNull(),

    // Analysis
    statisticalAnalysis: jsonb('statistical_analysis'),
    recommendations: text('recommendations'),

    // Status
    isAutomated: boolean('is_automated').default(true),
    sentTo: jsonb('sent_to').$type<string[]>().default([]),

    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    testIdIdx: index('ab_test_reports_test_idx').on(table.testId),
    reportTypeIdx: index('ab_test_reports_type_idx').on(table.reportType),
    reportDateIdx: index('ab_test_reports_date_idx').on(table.reportDate),
  })
);

// A/B Test segments table - for advanced segmentation
export const abTestSegments = pgTable(
  'ab_test_segments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    testId: uuid('test_id')
      .notNull()
      .references(() => abTests.id, { onDelete: 'cascade' }),

    // Segment definition
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    rules: jsonb('rules').notNull(), // Segmentation rules

    // Metrics per variant
    variantMetrics: jsonb('variant_metrics').notNull(),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    testIdIdx: index('ab_test_segments_test_idx').on(table.testId),
    nameIdx: index('ab_test_segments_name_idx').on(table.name),
  })
);

// Create schemas for validation
export const insertABTestSchema = createInsertSchema(abTests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as const);

export const insertABTestMetricsSchema = createInsertSchema(abTestMetrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as const);

export const insertABTestEventSchema = createInsertSchema(abTestEvents).omit({
  id: true,
  timestamp: true,
} as const);

export const insertABTestReportSchema = createInsertSchema(abTestReports).omit({
  id: true,
  createdAt: true,
} as const);

export const insertABTestSegmentSchema = createInsertSchema(abTestSegments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as const);

// Types
export type ABTest = typeof abTests.$inferSelect;
export type InsertABTest = z.infer<typeof insertABTestSchema>;

export type ABTestMetrics = typeof abTestMetrics.$inferSelect;
export type InsertABTestMetrics = z.infer<typeof insertABTestMetricsSchema>;

export type ABTestEvent = typeof abTestEvents.$inferSelect;
export type InsertABTestEvent = z.infer<typeof insertABTestEventSchema>;

export type ABTestReport = typeof abTestReports.$inferSelect;
export type InsertABTestReport = z.infer<typeof insertABTestReportSchema>;

export type ABTestSegment = typeof abTestSegments.$inferSelect;
export type InsertABTestSegment = z.infer<typeof insertABTestSegmentSchema>;
