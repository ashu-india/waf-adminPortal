import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "./db";
import { v4 as uuidv4 } from "uuid";

// Types
export interface UserAttributes {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: "admin" | "operator" | "viewer";
  tenantIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}
export interface UserCreationAttributes extends Optional<UserAttributes, "id" | "createdAt" | "updatedAt"> {}
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare email: string;
  declare firstName?: string;
  declare lastName?: string;
  declare profileImageUrl?: string;
  declare role: "admin" | "operator" | "viewer";
  declare tenantIds?: string[];
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export interface TenantAttributes {
  id: string;
  name: string;
  domain: string;
  upstreamUrl: string;
  sslEnabled: boolean;
  sslCertPath?: string;
  sslKeyPath?: string;
  isActive: boolean;
  retentionDays: number;
  anonymizeIpAfterDays: number;
  scrubCookies: boolean;
  scrubAuthHeaders: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export interface TenantCreationAttributes extends Optional<TenantAttributes, "id" | "createdAt" | "updatedAt"> {}
export class Tenant extends Model<TenantAttributes, TenantCreationAttributes> implements TenantAttributes {
  declare id: string;
  declare name: string;
  declare domain: string;
  declare upstreamUrl: string;
  declare sslEnabled: boolean;
  declare sslCertPath?: string;
  declare sslKeyPath?: string;
  declare isActive: boolean;
  declare retentionDays: number;
  declare anonymizeIpAfterDays: number;
  declare scrubCookies: boolean;
  declare scrubAuthHeaders: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export interface PolicyAttributes {
  id: string;
  tenantId: string;
  name: string;
  enforcementMode: "monitor" | "block";
  blockThreshold: number;
  challengeThreshold: number;
  monitorThreshold: number;
  rateLimit: number;
  rateLimitWindow: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export interface PolicyCreationAttributes extends Optional<PolicyAttributes, "id" | "createdAt" | "updatedAt"> {}
export class Policy extends Model<PolicyAttributes, PolicyCreationAttributes> implements PolicyAttributes {
  declare id: string;
  declare tenantId: string;
  declare name: string;
  declare enforcementMode: "monitor" | "block";
  declare blockThreshold: number;
  declare challengeThreshold: number;
  declare monitorThreshold: number;
  declare rateLimit: number;
  declare rateLimitWindow: number;
  declare isDefault: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export interface WafRuleAttributes {
  id: string;
  tenantId?: string;
  name: string;
  description?: string;
  category: string;
  severity: string;
  pattern: string;
  patternType: string;
  targetField: string;
  action: "allow" | "monitor" | "challenge" | "deny";
  score: number;
  enabled: boolean;
  isBuiltIn: boolean;
  hitCount: number;
  createdAt: Date;
  updatedAt: Date;
}
export interface WafRuleCreationAttributes extends Optional<WafRuleAttributes, "id" | "createdAt" | "updatedAt"> {}
export class WafRule extends Model<WafRuleAttributes, WafRuleCreationAttributes> implements WafRuleAttributes {
  declare id: string;
  declare tenantId?: string;
  declare name: string;
  declare description?: string;
  declare category: string;
  declare severity: string;
  declare pattern: string;
  declare patternType: string;
  declare targetField: string;
  declare action: "allow" | "monitor" | "challenge" | "deny";
  declare score: number;
  declare enabled: boolean;
  declare isBuiltIn: boolean;
  declare hitCount: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export interface RequestAttributes {
  id: string;
  tenantId: string;
  timestamp: Date;
  clientIp?: string;
  clientIpAnonymized: boolean;
  method: string;
  path: string;
  queryString?: string;
  headersJson?: any;
  bodyRef?: string;
  bodyPreview?: string;
  userAgent?: string;
  referer?: string;
  contentType?: string;
  contentLength?: number;
  responseCode?: number;
  responseHeadersJson?: any;
  responseBodyRef?: string;
  responseTime?: number;
  analysisId?: string;
  actionTaken: "allow" | "monitor" | "challenge" | "deny";
  wafHitsJson?: any;
  country?: string;
  city?: string;
  createdAt: Date;
}
export interface RequestCreationAttributes extends Optional<RequestAttributes, "id" | "createdAt"> {}
export class Request extends Model<RequestAttributes, RequestCreationAttributes> implements RequestAttributes {
  declare id: string;
  declare tenantId: string;
  declare timestamp: Date;
  declare clientIp?: string;
  declare clientIpAnonymized: boolean;
  declare method: string;
  declare path: string;
  declare queryString?: string;
  declare headersJson?: any;
  declare bodyRef?: string;
  declare bodyPreview?: string;
  declare userAgent?: string;
  declare referer?: string;
  declare contentType?: string;
  declare contentLength?: number;
  declare responseCode?: number;
  declare responseHeadersJson?: any;
  declare responseBodyRef?: string;
  declare responseTime?: number;
  declare analysisId?: string;
  declare actionTaken: "allow" | "monitor" | "challenge" | "deny";
  declare wafHitsJson?: any;
  declare country?: string;
  declare city?: string;
  declare readonly createdAt: Date;
}

export interface AnalysisAttributes {
  id: string;
  requestId: string;
  totalScore: number;
  suggestedAction: "allow" | "monitor" | "challenge" | "deny";
  finalAction: "allow" | "monitor" | "challenge" | "deny";
  breakdownJson?: any;
  matchedRulesJson?: any;
  ipReputationScore: number;
  rateAnomalyScore: number;
  headerAnomalyScore: number;
  pathAnomalyScore: number;
  bodyAnomalyScore: number;
  processingTimeMs?: number;
  explanationText?: string;
  createdAt: Date;
}
export interface AnalysisCreationAttributes extends Optional<AnalysisAttributes, "id" | "createdAt"> {}
export class Analysis extends Model<AnalysisAttributes, AnalysisCreationAttributes> implements AnalysisAttributes {
  declare id: string;
  declare requestId: string;
  declare totalScore: number;
  declare suggestedAction: "allow" | "monitor" | "challenge" | "deny";
  declare finalAction: "allow" | "monitor" | "challenge" | "deny";
  declare breakdownJson?: any;
  declare matchedRulesJson?: any;
  declare ipReputationScore: number;
  declare rateAnomalyScore: number;
  declare headerAnomalyScore: number;
  declare pathAnomalyScore: number;
  declare bodyAnomalyScore: number;
  declare processingTimeMs?: number;
  declare explanationText?: string;
  declare readonly createdAt: Date;
}

export interface OverrideAttributes {
  id: string;
  overrideType: "request" | "rule" | "ip";
  targetId: string;
  tenantId?: string;
  action: "allow" | "monitor" | "challenge" | "deny";
  operatorId: string;
  reason?: string;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
}
export interface OverrideCreationAttributes extends Optional<OverrideAttributes, "id" | "createdAt"> {}
export class Override extends Model<OverrideAttributes, OverrideCreationAttributes> implements OverrideAttributes {
  declare id: string;
  declare overrideType: "request" | "rule" | "ip";
  declare targetId: string;
  declare tenantId?: string;
  declare action: "allow" | "monitor" | "challenge" | "deny";
  declare operatorId: string;
  declare reason?: string;
  declare expiresAt?: Date;
  declare isActive: boolean;
  declare readonly createdAt: Date;
}

export interface AlertAttributes {
  id: string;
  tenantId?: string;
  severity: string;
  type: string;
  title: string;
  message: string;
  metadata?: any;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: Date;
}
export interface AlertCreationAttributes extends Optional<AlertAttributes, "id" | "createdAt"> {}
export class Alert extends Model<AlertAttributes, AlertCreationAttributes> implements AlertAttributes {
  declare id: string;
  declare tenantId?: string;
  declare severity: string;
  declare type: string;
  declare title: string;
  declare message: string;
  declare metadata?: any;
  declare isRead: boolean;
  declare isDismissed: boolean;
  declare readonly createdAt: Date;
}

export interface WebhookAttributes {
  id: string;
  tenantId?: string;
  name: string;
  url: string;
  secret?: string;
  events?: string[];
  isActive: boolean;
  lastTriggeredAt?: Date;
  failureCount: number;
  createdAt: Date;
}
export interface WebhookCreationAttributes extends Optional<WebhookAttributes, "id" | "createdAt"> {}
export class Webhook extends Model<WebhookAttributes, WebhookCreationAttributes> implements WebhookAttributes {
  declare id: string;
  declare tenantId?: string;
  declare name: string;
  declare url: string;
  declare secret?: string;
  declare events?: string[];
  declare isActive: boolean;
  declare lastTriggeredAt?: Date;
  declare failureCount: number;
  declare readonly createdAt: Date;
}

export interface IpListAttributes {
  id: string;
  tenantId?: string;
  ipAddress: string;
  listType: string;
  reason?: string;
  expiresAt?: Date;
  createdBy?: string;
  createdAt: Date;
}
export interface IpListCreationAttributes extends Optional<IpListAttributes, "id" | "createdAt"> {}
export class IpList extends Model<IpListAttributes, IpListCreationAttributes> implements IpListAttributes {
  declare id: string;
  declare tenantId?: string;
  declare ipAddress: string;
  declare listType: string;
  declare reason?: string;
  declare expiresAt?: Date;
  declare createdBy?: string;
  declare readonly createdAt: Date;
}

// Initialize models
export function initializeModels() {
  User.init(
    {
      id: { type: DataTypes.STRING, primaryKey: true, defaultValue: () => uuidv4() },
      email: { type: DataTypes.STRING, unique: true },
      firstName: DataTypes.STRING,
      lastName: DataTypes.STRING,
      profileImageUrl: DataTypes.STRING,
      role: { type: DataTypes.ENUM("admin", "operator", "viewer"), defaultValue: "viewer" },
      tenantIds: { type: DataTypes.JSON, defaultValue: [] },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { sequelize, tableName: "users", timestamps: true }
  );

  Tenant.init(
    {
      id: { type: DataTypes.STRING, primaryKey: true, defaultValue: () => uuidv4() },
      name: DataTypes.STRING,
      domain: { type: DataTypes.STRING, unique: true },
      upstreamUrl: DataTypes.STRING,
      sslEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
      sslCertPath: DataTypes.STRING,
      sslKeyPath: DataTypes.STRING,
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
      retentionDays: { type: DataTypes.INTEGER, defaultValue: 30 },
      anonymizeIpAfterDays: { type: DataTypes.INTEGER, defaultValue: 7 },
      scrubCookies: { type: DataTypes.BOOLEAN, defaultValue: true },
      scrubAuthHeaders: { type: DataTypes.BOOLEAN, defaultValue: true },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { sequelize, tableName: "tenants", timestamps: true }
  );

  Policy.init(
    {
      id: { type: DataTypes.STRING, primaryKey: true, defaultValue: () => uuidv4() },
      tenantId: { type: DataTypes.STRING, references: { model: Tenant, key: 'id' } },
      name: DataTypes.STRING,
      enforcementMode: { type: DataTypes.ENUM("monitor", "block"), defaultValue: "monitor" },
      blockThreshold: { type: DataTypes.FLOAT, defaultValue: 70 },
      challengeThreshold: { type: DataTypes.FLOAT, defaultValue: 50 },
      monitorThreshold: { type: DataTypes.FLOAT, defaultValue: 30 },
      rateLimit: { type: DataTypes.INTEGER, defaultValue: 100 },
      rateLimitWindow: { type: DataTypes.INTEGER, defaultValue: 60 },
      isDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { sequelize, tableName: "policies", timestamps: true }
  );

  WafRule.init(
    {
      id: { type: DataTypes.STRING, primaryKey: true, defaultValue: () => uuidv4() },
      tenantId: { type: DataTypes.STRING, references: { model: Tenant, key: 'id' }, allowNull: true },
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
      category: DataTypes.STRING,
      severity: { type: DataTypes.STRING, defaultValue: "medium" },
      pattern: DataTypes.TEXT,
      patternType: { type: DataTypes.STRING, defaultValue: "regex" },
      targetField: DataTypes.STRING,
      action: { type: DataTypes.ENUM("allow", "monitor", "challenge", "deny"), defaultValue: "deny" },
      score: { type: DataTypes.INTEGER, defaultValue: 10 },
      enabled: { type: DataTypes.BOOLEAN, defaultValue: true },
      isBuiltIn: { type: DataTypes.BOOLEAN, defaultValue: false },
      hitCount: { type: DataTypes.INTEGER, defaultValue: 0 },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { sequelize, tableName: "waf_rules", timestamps: true }
  );

  Request.init(
    {
      id: { type: DataTypes.STRING, primaryKey: true, defaultValue: () => uuidv4() },
      tenantId: { type: DataTypes.STRING, references: { model: Tenant, key: 'id' } },
      timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      clientIp: DataTypes.STRING,
      clientIpAnonymized: { type: DataTypes.BOOLEAN, defaultValue: false },
      method: DataTypes.STRING,
      path: DataTypes.TEXT,
      queryString: DataTypes.TEXT,
      headersJson: DataTypes.JSON,
      bodyRef: DataTypes.STRING,
      bodyPreview: DataTypes.TEXT,
      userAgent: DataTypes.TEXT,
      referer: DataTypes.TEXT,
      contentType: DataTypes.STRING,
      contentLength: DataTypes.INTEGER,
      responseCode: DataTypes.INTEGER,
      responseHeadersJson: DataTypes.JSON,
      responseBodyRef: DataTypes.STRING,
      responseTime: DataTypes.INTEGER,
      analysisId: DataTypes.STRING,
      actionTaken: { type: DataTypes.ENUM("allow", "monitor", "challenge", "deny"), defaultValue: "allow" },
      wafHitsJson: DataTypes.JSON,
      country: DataTypes.STRING,
      city: DataTypes.STRING,
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { sequelize, tableName: "requests", timestamps: false }
  );

  Analysis.init(
    {
      id: { type: DataTypes.STRING, primaryKey: true, defaultValue: () => uuidv4() },
      requestId: { type: DataTypes.STRING, references: { model: Request, key: 'id' } },
      totalScore: { type: DataTypes.FLOAT, defaultValue: 0 },
      suggestedAction: { type: DataTypes.ENUM("allow", "monitor", "challenge", "deny"), defaultValue: "allow" },
      finalAction: { type: DataTypes.ENUM("allow", "monitor", "challenge", "deny"), defaultValue: "allow" },
      breakdownJson: DataTypes.JSON,
      matchedRulesJson: DataTypes.JSON,
      ipReputationScore: { type: DataTypes.FLOAT, defaultValue: 0 },
      rateAnomalyScore: { type: DataTypes.FLOAT, defaultValue: 0 },
      headerAnomalyScore: { type: DataTypes.FLOAT, defaultValue: 0 },
      pathAnomalyScore: { type: DataTypes.FLOAT, defaultValue: 0 },
      bodyAnomalyScore: { type: DataTypes.FLOAT, defaultValue: 0 },
      processingTimeMs: DataTypes.INTEGER,
      explanationText: DataTypes.TEXT,
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { sequelize, tableName: "analysis", timestamps: false }
  );

  Override.init(
    {
      id: { type: DataTypes.STRING, primaryKey: true, defaultValue: () => uuidv4() },
      overrideType: { type: DataTypes.ENUM("request", "rule", "ip") },
      targetId: DataTypes.STRING,
      tenantId: { type: DataTypes.STRING, references: { model: Tenant, key: 'id' }, allowNull: true },
      action: { type: DataTypes.ENUM("allow", "monitor", "challenge", "deny") },
      operatorId: { type: DataTypes.STRING, references: { model: User, key: 'id' } },
      reason: DataTypes.TEXT,
      expiresAt: DataTypes.DATE,
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { sequelize, tableName: "overrides", timestamps: false }
  );

  Alert.init(
    {
      id: { type: DataTypes.STRING, primaryKey: true, defaultValue: () => uuidv4() },
      tenantId: { type: DataTypes.STRING, references: { model: Tenant, key: 'id' }, allowNull: true },
      severity: DataTypes.STRING,
      type: DataTypes.STRING,
      title: DataTypes.STRING,
      message: DataTypes.TEXT,
      metadata: DataTypes.JSON,
      isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
      isDismissed: { type: DataTypes.BOOLEAN, defaultValue: false },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { sequelize, tableName: "alerts", timestamps: false }
  );

  Webhook.init(
    {
      id: { type: DataTypes.STRING, primaryKey: true, defaultValue: () => uuidv4() },
      tenantId: { type: DataTypes.STRING, references: { model: Tenant, key: 'id' }, allowNull: true },
      name: DataTypes.STRING,
      url: DataTypes.STRING,
      secret: DataTypes.STRING,
      events: DataTypes.JSON,
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
      lastTriggeredAt: DataTypes.DATE,
      failureCount: { type: DataTypes.INTEGER, defaultValue: 0 },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { sequelize, tableName: "webhooks", timestamps: false }
  );

  IpList.init(
    {
      id: { type: DataTypes.STRING, primaryKey: true, defaultValue: () => uuidv4() },
      tenantId: { type: DataTypes.STRING, references: { model: Tenant, key: 'id' }, allowNull: true },
      ipAddress: DataTypes.STRING,
      listType: DataTypes.STRING,
      reason: DataTypes.TEXT,
      expiresAt: DataTypes.DATE,
      createdBy: { type: DataTypes.STRING, references: { model: User, key: 'id' }, allowNull: true },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { sequelize, tableName: "ip_lists", timestamps: false }
  );
}
