"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertABTestSegmentSchema = exports.insertABTestReportSchema = exports.insertABTestEventSchema = exports.insertABTestMetricsSchema = exports.insertABTestSchema = exports.abTestSegments = exports.abTestReports = exports.abTestEvents = exports.abTestMetrics = exports.abTests = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_zod_1 = require("drizzle-zod");
const schema_1 = require("./schema");
// A/B Test definition table
exports.abTests = (0, pg_core_1.pgTable)('ab_tests', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 200 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    // Test configuration
    testType: (0, pg_core_1.varchar)('test_type', { length: 50 }).notNull().default('landing_background'),
    variants: (0, pg_core_1.jsonb)('variants').notNull().$type(), // ['neural', 'code', 'geometric', 'default']
    trafficSplit: (0, pg_core_1.jsonb)('traffic_split').$type(), // { 'neural': 0.25, 'code': 0.25, ... }
    // Test parameters
    successMetric: (0, pg_core_1.varchar)('success_metric', { length: 100 }).notNull(), // 'trial_signup', 'cta_click'
    minimumSampleSize: (0, pg_core_1.integer)('minimum_sample_size').default(1000),
    confidenceThreshold: (0, pg_core_1.real)('confidence_threshold').default(0.95),
    // Test status
    status: (0, pg_core_1.varchar)('status', { length: 20 }).notNull().default('draft'), // draft, active, paused, completed
    startDate: (0, pg_core_1.timestamp)('start_date'),
    endDate: (0, pg_core_1.timestamp)('end_date'),
    // Results
    winner: (0, pg_core_1.varchar)('winner', { length: 100 }),
    winnerConfidence: (0, pg_core_1.real)('winner_confidence'),
    finalResults: (0, pg_core_1.jsonb)('final_results'),
    // Metadata
    createdBy: (0, pg_core_1.varchar)('created_by').references(() => schema_1.users.id),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    statusIdx: (0, pg_core_1.index)('ab_tests_status_idx').on(table.status),
    typeIdx: (0, pg_core_1.index)('ab_tests_type_idx').on(table.testType),
    dateIdx: (0, pg_core_1.index)('ab_tests_date_idx').on(table.startDate, table.endDate),
}));
// A/B Test metrics aggregation table
exports.abTestMetrics = (0, pg_core_1.pgTable)('ab_test_metrics', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    testId: (0, pg_core_1.uuid)('test_id')
        .notNull()
        .references(() => exports.abTests.id, { onDelete: 'cascade' }),
    variant: (0, pg_core_1.varchar)('variant', { length: 100 }).notNull(),
    // Core metrics
    pageViews: (0, pg_core_1.integer)('page_views').notNull().default(0),
    uniqueVisitors: (0, pg_core_1.integer)('unique_visitors').notNull().default(0),
    totalSessions: (0, pg_core_1.integer)('total_sessions').notNull().default(0),
    // Conversion funnel
    seeWhatsInsideClicks: (0, pg_core_1.integer)('see_whats_inside_clicks').notNull().default(0),
    ctaClicks: (0, pg_core_1.integer)('cta_clicks').notNull().default(0),
    trialSignups: (0, pg_core_1.integer)('trial_signups').notNull().default(0),
    newsletterSignups: (0, pg_core_1.integer)('newsletter_signups').notNull().default(0),
    pricingPageViews: (0, pg_core_1.integer)('pricing_page_views').notNull().default(0),
    // Engagement metrics
    bounceRate: (0, pg_core_1.real)('bounce_rate').default(0),
    avgSessionDuration: (0, pg_core_1.real)('avg_session_duration').default(0), // in seconds
    avgScrollDepth: (0, pg_core_1.real)('avg_scroll_depth').default(0), // percentage
    // Device and browser breakdown
    deviceBreakdown: (0, pg_core_1.jsonb)('device_breakdown').$type().default({}),
    browserBreakdown: (0, pg_core_1.jsonb)('browser_breakdown').$type().default({}),
    // UTM tracking
    utmSourceBreakdown: (0, pg_core_1.jsonb)('utm_source_breakdown').$type().default({}),
    utmMediumBreakdown: (0, pg_core_1.jsonb)('utm_medium_breakdown').$type().default({}),
    // Time-based metrics
    hourlyDistribution: (0, pg_core_1.jsonb)('hourly_distribution').$type().default({}),
    dayOfWeekDistribution: (0, pg_core_1.jsonb)('day_of_week_distribution')
        .$type()
        .default({}),
    // Statistical data
    conversionRate: (0, pg_core_1.real)('conversion_rate').default(0),
    confidenceInterval: (0, pg_core_1.jsonb)('confidence_interval').$type(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    testVariantUnique: (0, pg_core_1.unique)().on(table.testId, table.variant),
    testIdIdx: (0, pg_core_1.index)('ab_test_metrics_test_idx').on(table.testId),
    variantIdx: (0, pg_core_1.index)('ab_test_metrics_variant_idx').on(table.variant),
}));
// A/B Test events table - raw event data
exports.abTestEvents = (0, pg_core_1.pgTable)('ab_test_events', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    testId: (0, pg_core_1.uuid)('test_id')
        .notNull()
        .references(() => exports.abTests.id, { onDelete: 'cascade' }),
    variant: (0, pg_core_1.varchar)('variant', { length: 100 }).notNull(),
    // Event details
    eventType: (0, pg_core_1.varchar)('event_type', { length: 100 }).notNull(), // 'page_view', 'cta_click', 'conversion'
    eventName: (0, pg_core_1.varchar)('event_name', { length: 200 }),
    properties: (0, pg_core_1.jsonb)('properties').default({}),
    // Session info
    sessionId: (0, pg_core_1.varchar)('session_id', { length: 100 }),
    userId: (0, pg_core_1.varchar)('user_id', { length: 100 }),
    // Context
    deviceType: (0, pg_core_1.varchar)('device_type', { length: 20 }),
    browser: (0, pg_core_1.varchar)('browser', { length: 50 }),
    ipAddress: (0, pg_core_1.varchar)('ip_address', { length: 45 }),
    userAgent: (0, pg_core_1.text)('user_agent'),
    referrer: (0, pg_core_1.text)('referrer'),
    // UTM parameters
    utmSource: (0, pg_core_1.varchar)('utm_source', { length: 100 }),
    utmMedium: (0, pg_core_1.varchar)('utm_medium', { length: 100 }),
    utmCampaign: (0, pg_core_1.varchar)('utm_campaign', { length: 100 }),
    timestamp: (0, pg_core_1.timestamp)('timestamp').defaultNow(),
}, table => ({
    testIdIdx: (0, pg_core_1.index)('ab_test_events_test_idx').on(table.testId),
    variantIdx: (0, pg_core_1.index)('ab_test_events_variant_idx').on(table.variant),
    eventTypeIdx: (0, pg_core_1.index)('ab_test_events_type_idx').on(table.eventType),
    timestampIdx: (0, pg_core_1.index)('ab_test_events_timestamp_idx').on(table.timestamp),
    sessionIdx: (0, pg_core_1.index)('ab_test_events_session_idx').on(table.sessionId),
}));
// A/B Test reports table
exports.abTestReports = (0, pg_core_1.pgTable)('ab_test_reports', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    testId: (0, pg_core_1.uuid)('test_id')
        .notNull()
        .references(() => exports.abTests.id, { onDelete: 'cascade' }),
    // Report details
    reportType: (0, pg_core_1.varchar)('report_type', { length: 50 }).notNull(), // 'daily', 'weekly', 'final'
    reportDate: (0, pg_core_1.timestamp)('report_date').notNull(),
    // Metrics snapshot
    metricsSnapshot: (0, pg_core_1.jsonb)('metrics_snapshot').notNull(),
    // Analysis
    statisticalAnalysis: (0, pg_core_1.jsonb)('statistical_analysis'),
    recommendations: (0, pg_core_1.text)('recommendations'),
    // Status
    isAutomated: (0, pg_core_1.boolean)('is_automated').default(true),
    sentTo: (0, pg_core_1.jsonb)('sent_to').$type().default([]),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, table => ({
    testIdIdx: (0, pg_core_1.index)('ab_test_reports_test_idx').on(table.testId),
    reportTypeIdx: (0, pg_core_1.index)('ab_test_reports_type_idx').on(table.reportType),
    reportDateIdx: (0, pg_core_1.index)('ab_test_reports_date_idx').on(table.reportDate),
}));
// A/B Test segments table - for advanced segmentation
exports.abTestSegments = (0, pg_core_1.pgTable)('ab_test_segments', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    testId: (0, pg_core_1.uuid)('test_id')
        .notNull()
        .references(() => exports.abTests.id, { onDelete: 'cascade' }),
    // Segment definition
    name: (0, pg_core_1.varchar)('name', { length: 100 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    rules: (0, pg_core_1.jsonb)('rules').notNull(), // Segmentation rules
    // Metrics per variant
    variantMetrics: (0, pg_core_1.jsonb)('variant_metrics').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, table => ({
    testIdIdx: (0, pg_core_1.index)('ab_test_segments_test_idx').on(table.testId),
    nameIdx: (0, pg_core_1.index)('ab_test_segments_name_idx').on(table.name),
}));
// Create schemas for validation
exports.insertABTestSchema = (0, drizzle_zod_1.createInsertSchema)(exports.abTests).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertABTestMetricsSchema = (0, drizzle_zod_1.createInsertSchema)(exports.abTestMetrics).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertABTestEventSchema = (0, drizzle_zod_1.createInsertSchema)(exports.abTestEvents).omit({
    id: true,
    timestamp: true,
});
exports.insertABTestReportSchema = (0, drizzle_zod_1.createInsertSchema)(exports.abTestReports).omit({
    id: true,
    createdAt: true,
});
exports.insertABTestSegmentSchema = (0, drizzle_zod_1.createInsertSchema)(exports.abTestSegments).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
