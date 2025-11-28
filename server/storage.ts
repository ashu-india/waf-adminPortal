import {
  type User, type UpsertUser, type InsertUser,
  type Tenant, type InsertTenant,
  type Policy, type InsertPolicy,
  type WafRule, type InsertWafRule,
  type Request, type InsertRequest,
  type Analysis, type InsertAnalysis,
  type Override, type InsertOverride,
  type Alert, type InsertAlert,
  type Webhook, type InsertWebhook,
  type IpList, type InsertIpList,
  type DashboardStats,
} from "@shared/schema";
import {
  User as UserModel,
  Tenant as TenantModel,
  Policy as PolicyModel,
  WafRule as WafRuleModel,
  Request as RequestModel,
  Analysis as AnalysisModel,
  Override as OverrideModel,
  Alert as AlertModel,
  Webhook as WebhookModel,
  IpList as IpListModel,
} from "./models";
import { Op } from "sequelize";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  // Tenants
  getTenants(): Promise<Tenant[]>;
  getTenant(id: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: string, data: Partial<Tenant>): Promise<Tenant | undefined>;
  deleteTenant(id: string): Promise<void>;

  // Policies
  getPolicies(): Promise<Policy[]>;
  getPolicy(id: string): Promise<Policy | undefined>;
  getPolicyByTenant(tenantId: string): Promise<Policy | undefined>;
  createPolicy(policy: InsertPolicy): Promise<Policy>;
  updatePolicy(id: string, data: Partial<Policy>): Promise<Policy | undefined>;
  deletePolicy(id: string): Promise<void>;

  // WAF Rules
  getRules(): Promise<WafRule[]>;
  getRule(id: string): Promise<WafRule | undefined>;
  getRulesByTenant(tenantId: string | null): Promise<WafRule[]>;
  createRule(rule: InsertWafRule): Promise<WafRule>;
  updateRule(id: string, data: Partial<WafRule>): Promise<WafRule | undefined>;
  deleteRule(id: string): Promise<void>;

  // Requests
  getRequests(tenantId?: string): Promise<Request[]>;
  getRequest(id: string): Promise<Request | undefined>;
  createRequest(request: InsertRequest): Promise<Request>;
  getRequestWithAnalysis(id: string): Promise<Request & { analysis?: Analysis } | undefined>;
  anonymizeOldIPs(tenantId: string, anonymizeDays: number): Promise<number>;

  // Analysis
  createAnalysis(analysisData: InsertAnalysis): Promise<Analysis>;

  // Overrides
  createOverride(override: InsertOverride): Promise<Override>;
  getOverridesByTenant(tenantId: string): Promise<Override[]>;

  // Alerts
  getAlerts(): Promise<Alert[]>;
  getAlert(id: string): Promise<Alert | undefined>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlert(id: string, data: Partial<Alert>): Promise<Alert | undefined>;
  markAllAlertsRead(): Promise<void>;

  // Webhooks
  getWebhooks(): Promise<Webhook[]>;
  getWebhook(id: string): Promise<Webhook | undefined>;
  createWebhook(webhook: InsertWebhook): Promise<Webhook>;
  updateWebhook(id: string, data: Partial<Webhook>): Promise<Webhook | undefined>;
  deleteWebhook(id: string): Promise<void>;

  // Export
  getRequestsForExport(tenantId?: string, startDate?: Date, endDate?: Date): Promise<Request[]>;
  deleteOldRequests(tenantId: string, retentionDays: number): Promise<number>;

  // IP Lists
  createIpList(ipList: InsertIpList): Promise<IpList>;
  getIpListsByTenant(tenantId: string): Promise<IpList[]>;

  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const user = await UserModel.findByPk(id);
    return user?.toJSON() as User | undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ where: { email } });
    return user?.toJSON() as User | undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const { id, role, email, firstName, lastName, profileImageUrl, tenantIds } = userData;
    const [user] = await UserModel.upsert(
      { id: id || undefined, email, firstName: firstName || null, lastName: lastName || null, role: role || "viewer", profileImageUrl: profileImageUrl || null, tenantIds: tenantIds || null } as any,
      { returning: true }
    );
    return user.toJSON() as User;
  }

  async getUsers(): Promise<User[]> {
    const users = await UserModel.findAll({ order: [['createdAt', 'DESC']] });
    return users.map(u => u.toJSON() as User);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const user = await UserModel.findByPk(id);
    if (!user) return undefined;
    const updateData: any = {};
    if (data.email !== undefined) updateData.email = data.email;
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.profileImageUrl !== undefined) updateData.profileImageUrl = data.profileImageUrl;
    if (data.tenantIds !== undefined) updateData.tenantIds = data.tenantIds;
    await user.update(updateData);
    return user.toJSON() as User;
  }

  // Tenants
  async getTenants(): Promise<Tenant[]> {
    const tenants = await TenantModel.findAll({ order: [['createdAt', 'DESC']] });
    return tenants.map(t => t.toJSON() as Tenant);
  }

  async getTenant(id: string): Promise<Tenant | undefined> {
    const tenant = await TenantModel.findByPk(id);
    return tenant?.toJSON() as Tenant | undefined;
  }

  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const created = await TenantModel.create(tenant as any);
    return created.toJSON() as Tenant;
  }

  async updateTenant(id: string, data: Partial<Tenant>): Promise<Tenant | undefined> {
    const tenant = await TenantModel.findByPk(id);
    if (!tenant) return undefined;
    const updateData: any = {};
    Object.keys(data).forEach(key => {
      if (data[key as keyof Tenant] !== undefined) {
        updateData[key] = data[key as keyof Tenant];
      }
    });
    await tenant.update(updateData);
    return tenant.toJSON() as Tenant;
  }

  async deleteTenant(id: string): Promise<void> {
    await TenantModel.destroy({ where: { id } });
  }

  // Policies
  async getPolicies(): Promise<Policy[]> {
    const policies = await PolicyModel.findAll({ order: [['createdAt', 'DESC']] });
    return policies.map(p => p.toJSON() as Policy);
  }

  async getPolicy(id: string): Promise<Policy | undefined> {
    const policy = await PolicyModel.findByPk(id);
    return policy?.toJSON() as Policy | undefined;
  }

  async getPolicyByTenant(tenantId: string): Promise<Policy | undefined> {
    const policy = await PolicyModel.findOne({ where: { tenantId } });
    return policy?.toJSON() as Policy | undefined;
  }

  async createPolicy(policy: InsertPolicy): Promise<Policy> {
    const created = await PolicyModel.create(policy as any);
    return created.toJSON() as Policy;
  }

  async updatePolicy(id: string, data: Partial<Policy>): Promise<Policy | undefined> {
    const policy = await PolicyModel.findByPk(id);
    if (!policy) return undefined;
    const updateData: any = {};
    Object.keys(data).forEach(key => {
      if (data[key as keyof Policy] !== undefined) {
        updateData[key] = data[key as keyof Policy];
      }
    });
    await policy.update(updateData);
    return policy.toJSON() as Policy;
  }

  async deletePolicy(id: string): Promise<void> {
    await PolicyModel.destroy({ where: { id } });
  }

  // WAF Rules
  async getRules(): Promise<WafRule[]> {
    const rules = await WafRuleModel.findAll({ order: [['createdAt', 'DESC']] });
    return rules.map(r => r.toJSON() as WafRule);
  }

  async getRule(id: string): Promise<WafRule | undefined> {
    const rule = await WafRuleModel.findByPk(id);
    return rule?.toJSON() as WafRule | undefined;
  }

  async getRulesByTenant(tenantId: string | null): Promise<WafRule[]> {
    const where: any = tenantId === null ? { tenantId: null } : { tenantId };
    const rules = await WafRuleModel.findAll({ where });
    return rules.map(r => r.toJSON() as WafRule);
  }

  async createRule(rule: InsertWafRule): Promise<WafRule> {
    const created = await WafRuleModel.create(rule as any);
    return created.toJSON() as WafRule;
  }

  async updateRule(id: string, data: Partial<WafRule>): Promise<WafRule | undefined> {
    const rule = await WafRuleModel.findByPk(id);
    if (!rule) return undefined;
    const updateData: any = {};
    Object.keys(data).forEach(key => {
      if (data[key as keyof WafRule] !== undefined) {
        updateData[key] = data[key as keyof WafRule];
      }
    });
    await rule.update(updateData);
    return rule.toJSON() as WafRule;
  }

  async deleteRule(id: string): Promise<void> {
    await WafRuleModel.destroy({ where: { id } });
  }

  // Requests
  async getRequests(tenantId?: string): Promise<Request[]> {
    const requests = await RequestModel.findAll({
      where: tenantId ? { tenantId } : {},
      order: [['timestamp', 'DESC']],
      limit: 500,
    });
    return requests.map(r => r.toJSON() as Request);
  }

  async getRequestsWithAnalysis(tenantId?: string): Promise<(Request & { analysis?: Analysis })[]> {
    const requests = await RequestModel.findAll({
      where: tenantId ? { tenantId } : {},
      order: [['timestamp', 'DESC']],
      limit: 500,
    });

    const analysisMap = new Map();
    const requestIds = requests.map(r => r.id);
    
    if (requestIds.length > 0) {
      const analyses = await AnalysisModel.findAll({
        where: { requestId: requestIds },
      });
      analyses.forEach(a => analysisMap.set(a.requestId, a.toJSON() as Analysis));
    }

    return requests.map(r => ({
      ...r.toJSON() as Request,
      analysis: analysisMap.get(r.id),
    }));
  }

  async getRequest(id: string): Promise<Request | undefined> {
    const request = await RequestModel.findByPk(id);
    return request?.toJSON() as Request | undefined;
  }

  async createRequest(request: InsertRequest): Promise<Request> {
    const created = await RequestModel.create(request as any);
    return created.toJSON() as Request;
  }

  async getRequestWithAnalysis(id: string): Promise<Request & { analysis?: Analysis } | undefined> {
    const request = await RequestModel.findByPk(id);
    if (!request) return undefined;

    const analysis = await AnalysisModel.findOne({ where: { requestId: id } });
    const requestJson = request.toJSON() as Request;
    
    return {
      ...requestJson,
      analysis: analysis ? (analysis.toJSON() as Analysis) : undefined,
    };
  }

  // Analysis
  async createAnalysis(analysisData: InsertAnalysis): Promise<Analysis> {
    const created = await AnalysisModel.create(analysisData as any);
    return created.toJSON() as Analysis;
  }

  // Overrides
  async createOverride(override: InsertOverride): Promise<Override> {
    const created = await OverrideModel.create(override as any);
    return created.toJSON() as Override;
  }

  async getOverridesByTenant(tenantId: string): Promise<Override[]> {
    const overrides = await OverrideModel.findAll({
      where: { tenantId },
      order: [['createdAt', 'DESC']],
    });
    return overrides.map(o => o.toJSON() as Override);
  }

  // Alerts
  async getAlerts(): Promise<Alert[]> {
    const alerts = await AlertModel.findAll({ order: [['createdAt', 'DESC']] });
    return alerts.map(a => a.toJSON() as Alert);
  }

  async getAlert(id: string): Promise<Alert | undefined> {
    const alert = await AlertModel.findByPk(id);
    return alert?.toJSON() as Alert | undefined;
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const created = await AlertModel.create(alert as any);
    return created.toJSON() as Alert;
  }

  async updateAlert(id: string, data: Partial<Alert>): Promise<Alert | undefined> {
    const alert = await AlertModel.findByPk(id);
    if (!alert) return undefined;
    const updateData: any = {};
    Object.keys(data).forEach(key => {
      if (data[key as keyof Alert] !== undefined) {
        updateData[key] = data[key as keyof Alert];
      }
    });
    await alert.update(updateData);
    return alert.toJSON() as Alert;
  }

  async markAllAlertsRead(): Promise<void> {
    await AlertModel.update({ isRead: true }, { where: {} });
  }

  // Webhooks
  async getWebhooks(): Promise<Webhook[]> {
    const webhooks = await WebhookModel.findAll({ order: [['createdAt', 'DESC']] });
    return webhooks.map(w => w.toJSON() as Webhook);
  }

  async getWebhook(id: string): Promise<Webhook | undefined> {
    const webhook = await WebhookModel.findByPk(id);
    return webhook?.toJSON() as Webhook | undefined;
  }

  async createWebhook(webhook: InsertWebhook): Promise<Webhook> {
    const created = await WebhookModel.create(webhook as any);
    return created.toJSON() as Webhook;
  }

  async updateWebhook(id: string, data: Partial<Webhook>): Promise<Webhook | undefined> {
    const webhook = await WebhookModel.findByPk(id);
    if (!webhook) return undefined;
    const updateData: any = {};
    Object.keys(data).forEach(key => {
      if (data[key as keyof Webhook] !== undefined) {
        updateData[key] = data[key as keyof Webhook];
      }
    });
    await webhook.update(updateData);
    return webhook.toJSON() as Webhook;
  }

  async deleteWebhook(id: string): Promise<void> {
    await WebhookModel.destroy({ where: { id } });
  }

  // Export data
  async getRequestsForExport(tenantId?: string, startDate?: Date, endDate?: Date): Promise<Request[]> {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (startDate) where.timestamp = { [Op.gte]: startDate };
    if (endDate) where.timestamp = { ...(where.timestamp || {}), [Op.lte]: endDate };

    const requests = await RequestModel.findAll({
      where,
      order: [['timestamp', 'DESC']],
    });
    return requests.map(r => r.toJSON() as Request);
  }

  // Data retention
  async deleteOldRequests(tenantId: string, retentionDays: number): Promise<number> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const count = await RequestModel.destroy({
      where: {
        tenantId,
        timestamp: { [Op.lte]: cutoffDate },
      },
    });
    return count;
  }

  // IP Anonymization
  async anonymizeOldIPs(tenantId: string, anonymizeDays: number): Promise<number> {
    const cutoffDate = new Date(Date.now() - anonymizeDays * 24 * 60 * 60 * 1000);
    // Find requests older than anonymizeDays
    const requests = await RequestModel.findAll({
      where: {
        tenantId,
        timestamp: { [Op.lte]: cutoffDate },
      },
    });

    let anonymizedCount = 0;
    for (const request of requests) {
      if (request.clientIp) {
        // Anonymize IPv4: replace last octet with .0
        // Anonymize IPv6: replace last section with :0
        let anonIp = request.clientIp;
        if (request.clientIp.includes(':')) {
          // IPv6
          anonIp = request.clientIp.substring(0, request.clientIp.lastIndexOf(':')) + ':0';
        } else if (request.clientIp.includes('.')) {
          // IPv4
          anonIp = request.clientIp.substring(0, request.clientIp.lastIndexOf('.')) + '.0';
        }
        await request.update({ clientIp: anonIp });
        anonymizedCount++;
      }
    }
    return anonymizedCount;
  }

  // Dashboard stats
  async getDashboardStats(): Promise<DashboardStats> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const requestStats = await RequestModel.count({
      where: { timestamp: { [Op.gte]: twentyFourHoursAgo } },
    });
    const blocked = await RequestModel.count({
      where: { timestamp: { [Op.gte]: twentyFourHoursAgo }, actionTaken: 'deny' },
    });
    const flagged = await RequestModel.count({
      where: { timestamp: { [Op.gte]: twentyFourHoursAgo }, actionTaken: 'monitor' },
    });
    const allowed = await RequestModel.count({
      where: { timestamp: { [Op.gte]: twentyFourHoursAgo }, actionTaken: 'allow' },
    });

    const tenantCount = await TenantModel.count({ where: { isActive: true } });
    const ruleCount = await WafRuleModel.count({ where: { enabled: true } });

    const recentAlerts = await AlertModel.findAll({
      where: { isDismissed: false },
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    const total = requestStats;
    const blockPercentage = total > 0 ? (blocked / total) * 100 : 0;

    return {
      totalRequests: total,
      blockedRequests: blocked,
      flaggedRequests: flagged,
      allowedRequests: allowed,
      blockPercentage,
      activeTenants: tenantCount,
      activeRules: ruleCount,
      recentAlerts: recentAlerts.map(a => a.toJSON() as Alert),
    };
  }

  // IP Lists
  async createIpList(ipList: InsertIpList): Promise<IpList> {
    const created = await IpListModel.create(ipList as any);
    return created.toJSON() as IpList;
  }

  async getIpListsByTenant(tenantId: string): Promise<IpList[]> {
    const lists = await IpListModel.findAll({ where: { tenantId } });
    return lists.map(l => l.toJSON() as IpList);
  }

  // Settings - stored as defaults for new tenants
  async getSettings(): Promise<any> {
    return {
      defaultEnforcementMode: "monitor",
      defaultBlockThreshold: 70,
      defaultRetentionDays: 30,
      anonymizeIpAfterDays: 7,
      enableWebhooks: false,
      alertThreshold: "high",
      emailNotifications: true,
      slackNotifications: false,
    };
  }

  async updateSettings(data: any): Promise<any> {
    // Settings are currently stored as defaults - can be enhanced to persist to database
    return data;
  }
}

export const storage = new DatabaseStorage();
