import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  real,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "operator", "viewer"]);
export const enforcementModeEnum = pgEnum("enforcement_mode", ["monitor", "block"]);
export const actionTakenEnum = pgEnum("action_taken", ["allow", "monitor", "challenge", "deny"]);
export const overrideTypeEnum = pgEnum("override_type", ["request", "rule", "ip"]);

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table - Extended for WAF with roles and tenant access
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default("viewer").notNull(),
  tenantIds: text("tenant_ids").array().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tenants table - Each tenant represents a protected website
export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }).notNull().unique(),
  upstreamUrl: varchar("upstream_url", { length: 500 }).notNull(),
  sslEnabled: boolean("ssl_enabled").default(false),
  sslCertPath: varchar("ssl_cert_path", { length: 500 }),
  sslKeyPath: varchar("ssl_key_path", { length: 500 }),
  isActive: boolean("is_active").default(true),
  retentionDays: integer("retention_days").default(30),
  anonymizeIpAfterDays: integer("anonymize_ip_after_days").default(7),
  scrubCookies: boolean("scrub_cookies").default(true),
  scrubAuthHeaders: boolean("scrub_auth_headers").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Policies table - Enforcement policies per tenant
export const policies = pgTable("policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  enforcementMode: enforcementModeEnum("enforcement_mode").default("monitor").notNull(),
  blockThreshold: real("block_threshold").default(70),
  challengeThreshold: real("challenge_threshold").default(50),
  monitorThreshold: real("monitor_threshold").default(30),
  rateLimit: integer("rate_limit").default(100),
  rateLimitWindow: integer("rate_limit_window").default(60),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// WAF Rules table - Custom and OWASP rules
export const wafRules = pgTable("waf_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  severity: varchar("severity", { length: 20 }).default("medium"),
  pattern: text("pattern").notNull(),
  patternType: varchar("pattern_type", { length: 50 }).default("regex"),
  targetField: varchar("target_field", { length: 100 }).notNull(),
  action: actionTakenEnum("action").default("deny"),
  score: integer("score").default(10),
  enabled: boolean("enabled").default(true),
  isBuiltIn: boolean("is_built_in").default(false),
  hitCount: integer("hit_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Requests table - Captured HTTP requests
export const requests = pgTable("requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  clientIp: varchar("client_ip", { length: 45 }),
  clientIpAnonymized: boolean("client_ip_anonymized").default(false),
  method: varchar("method", { length: 10 }).notNull(),
  path: text("path").notNull(),
  queryString: text("query_string"),
  headersJson: jsonb("headers_json"),
  bodyRef: varchar("body_ref", { length: 500 }),
  bodyPreview: text("body_preview"),
  userAgent: text("user_agent"),
  referer: text("referer"),
  contentType: varchar("content_type", { length: 255 }),
  contentLength: integer("content_length"),
  responseCode: integer("response_code"),
  responseHeadersJson: jsonb("response_headers_json"),
  responseBodyRef: varchar("response_body_ref", { length: 500 }),
  responseTime: integer("response_time"),
  analysisId: varchar("analysis_id"),
  actionTaken: actionTakenEnum("action_taken").default("allow"),
  wafHitsJson: jsonb("waf_hits_json"),
  country: varchar("country", { length: 2 }),
  city: varchar("city", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_requests_tenant_timestamp").on(table.tenantId, table.timestamp),
  index("IDX_requests_client_ip").on(table.clientIp),
  index("IDX_requests_action").on(table.actionTaken),
]);

// Analysis table - Scoring and decision breakdown
export const analysis = pgTable("analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull().references(() => requests.id, { onDelete: "cascade" }),
  totalScore: real("total_score").default(0),
  suggestedAction: actionTakenEnum("suggested_action").default("allow"),
  finalAction: actionTakenEnum("final_action").default("allow"),
  breakdownJson: jsonb("breakdown_json"),
  matchedRulesJson: jsonb("matched_rules_json"),
  ipReputationScore: real("ip_reputation_score").default(0),
  rateAnomalyScore: real("rate_anomaly_score").default(0),
  headerAnomalyScore: real("header_anomaly_score").default(0),
  pathAnomalyScore: real("path_anomaly_score").default(0),
  bodyAnomalyScore: real("body_anomaly_score").default(0),
  processingTimeMs: integer("processing_time_ms"),
  explanationText: text("explanation_text"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Overrides table - Manual operator decisions
export const overrides = pgTable("overrides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  overrideType: overrideTypeEnum("override_type").notNull(),
  targetId: varchar("target_id").notNull(),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  action: actionTakenEnum("action").notNull(),
  operatorId: varchar("operator_id").notNull().references(() => users.id),
  reason: text("reason"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Alerts table - System alerts and notifications
export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  severity: varchar("severity", { length: 20 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  isRead: boolean("is_read").default(false),
  isDismissed: boolean("is_dismissed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Webhooks table - External notification endpoints
export const webhooks = pgTable("webhooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  secret: varchar("secret", { length: 255 }),
  events: text("events").array().default(sql`ARRAY[]::text[]`),
  isActive: boolean("is_active").default(true),
  lastTriggeredAt: timestamp("last_triggered_at"),
  failureCount: integer("failure_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// IP Blocklist/Allowlist table
export const ipLists = pgTable("ip_lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  listType: varchar("list_type", { length: 20 }).notNull(),
  reason: text("reason"),
  expiresAt: timestamp("expires_at"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit Files table - References to stored bodies
export const auditFiles = pgTable("audit_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  requestId: varchar("request_id").references(() => requests.id, { onDelete: "cascade" }),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  pathOnDisk: varchar("path_on_disk", { length: 500 }).notNull(),
  sizeBytes: integer("size_bytes"),
  mimeType: varchar("mime_type", { length: 100 }),
  isCompressed: boolean("is_compressed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Analytics aggregates table - Pre-computed metrics
export const analyticsAggregates = pgTable("analytics_aggregates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  periodType: varchar("period_type", { length: 20 }).notNull(),
  totalRequests: integer("total_requests").default(0),
  blockedRequests: integer("blocked_requests").default(0),
  monitoredRequests: integer("monitored_requests").default(0),
  allowedRequests: integer("allowed_requests").default(0),
  challengedRequests: integer("challenged_requests").default(0),
  uniqueIps: integer("unique_ips").default(0),
  avgScore: real("avg_score").default(0),
  topRulesJson: jsonb("top_rules_json"),
  topIpsJson: jsonb("top_ips_json"),
  topPathsJson: jsonb("top_paths_json"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  overrides: many(overrides),
  ipLists: many(ipLists),
}));

export const tenantsRelations = relations(tenants, ({ many }) => ({
  policies: many(policies),
  wafRules: many(wafRules),
  requests: many(requests),
  alerts: many(alerts),
  webhooks: many(webhooks),
  ipLists: many(ipLists),
  auditFiles: many(auditFiles),
  analyticsAggregates: many(analyticsAggregates),
}));

export const policiesRelations = relations(policies, ({ one }) => ({
  tenant: one(tenants, {
    fields: [policies.tenantId],
    references: [tenants.id],
  }),
}));

export const wafRulesRelations = relations(wafRules, ({ one }) => ({
  tenant: one(tenants, {
    fields: [wafRules.tenantId],
    references: [tenants.id],
  }),
}));

export const requestsRelations = relations(requests, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [requests.tenantId],
    references: [tenants.id],
  }),
  analysis: one(analysis),
  auditFiles: many(auditFiles),
}));

export const analysisRelations = relations(analysis, ({ one }) => ({
  request: one(requests, {
    fields: [analysis.requestId],
    references: [requests.id],
  }),
}));

export const overridesRelations = relations(overrides, ({ one }) => ({
  tenant: one(tenants, {
    fields: [overrides.tenantId],
    references: [tenants.id],
  }),
  operator: one(users, {
    fields: [overrides.operatorId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPolicySchema = createInsertSchema(policies).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWafRuleSchema = createInsertSchema(wafRules).omit({ id: true, createdAt: true, updatedAt: true, hitCount: true });
export const insertRequestSchema = createInsertSchema(requests).omit({ id: true, createdAt: true });
export const insertAnalysisSchema = createInsertSchema(analysis).omit({ id: true, createdAt: true });
export const insertOverrideSchema = createInsertSchema(overrides).omit({ id: true, createdAt: true });
export const insertAlertSchema = createInsertSchema(alerts).omit({ id: true, createdAt: true });
export const insertWebhookSchema = createInsertSchema(webhooks).omit({ id: true, createdAt: true });
export const insertIpListSchema = createInsertSchema(ipLists).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

export type Policy = typeof policies.$inferSelect;
export type InsertPolicy = z.infer<typeof insertPolicySchema>;

export type WafRule = typeof wafRules.$inferSelect;
export type InsertWafRule = z.infer<typeof insertWafRuleSchema>;

export type Request = typeof requests.$inferSelect;
export type InsertRequest = z.infer<typeof insertRequestSchema>;

export type Analysis = typeof analysis.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;

export type Override = typeof overrides.$inferSelect;
export type InsertOverride = z.infer<typeof insertOverrideSchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export type Webhook = typeof webhooks.$inferSelect;
export type InsertWebhook = z.infer<typeof insertWebhookSchema>;

export type IpList = typeof ipLists.$inferSelect;
export type InsertIpList = z.infer<typeof insertIpListSchema>;

export type AuditFile = typeof auditFiles.$inferSelect;
export type AnalyticsAggregate = typeof analyticsAggregates.$inferSelect;

// Dashboard stats type
export type DashboardStats = {
  totalRequests: number;
  blockedRequests: number;
  flaggedRequests: number;
  allowedRequests: number;
  blockPercentage: number;
  activeTenants: number;
  activeRules: number;
  recentAlerts: Alert[];
};

// Request with analysis type
export type RequestWithAnalysis = Request & {
  analysis?: Analysis;
};
