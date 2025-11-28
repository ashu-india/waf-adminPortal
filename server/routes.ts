import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertTenantSchema, insertPolicySchema, insertWafRuleSchema,
  insertAlertSchema, insertOverrideSchema
} from "@shared/schema";
import { z } from "zod";
import { wafEngine } from "./waf/engine";
import { sseServer } from "./waf/sse";
import { startWafProxy } from "./waf/proxy";
import passport from "passport";
import { rateLimit, requireRole, sanitizeInput } from "./middleware";
import { startDataRetentionJob, triggerWebhooks } from "./jobs";

// Helper function to scrub sensitive headers
function scrubHeaders(headers: Record<string, any>, scrubCookies: boolean, scrubAuthHeaders: boolean): Record<string, any> {
  const scrubbed = { ...headers };
  
  if (scrubCookies) {
    delete scrubbed['cookie'];
    delete scrubbed['set-cookie'];
  }
  
  if (scrubAuthHeaders) {
    delete scrubbed['authorization'];
    delete scrubbed['x-api-key'];
    delete scrubbed['x-auth-token'];
    delete scrubbed['x-access-token'];
  }
  
  return scrubbed;
}

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  // Add cache headers for GET requests
  if (req.method === "GET") {
    res.set("Cache-Control", "private, max-age=1800"); // 30 minutes cache
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  // Apply rate limiting to login
  app.post("/api/login", rateLimit(60000, 5), (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (err: any) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        res.json(user);
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      // Redirect to landing page after logout
      res.redirect("/");
    });
  });

  app.get("/api/auth/user", async (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(req.user);
  });

  // Dashboard
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Tenants
  app.get("/api/tenants", requireAuth, async (req, res) => {
    try {
      const tenants = await storage.getTenants();
      res.json(tenants);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      res.status(500).json({ message: "Failed to fetch tenants" });
    }
  });

  app.get("/api/tenants/:id", requireAuth, async (req, res) => {
    try {
      const tenant = await storage.getTenant(req.params.id);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      res.json(tenant);
    } catch (error) {
      console.error("Error fetching tenant:", error);
      res.status(500).json({ message: "Failed to fetch tenant" });
    }
  });

  app.post("/api/tenants", requireRole("admin"), async (req, res) => {
    try {
      const data = insertTenantSchema.parse(req.body);
      const tenant = await storage.createTenant(data);
      
      // Create default policy for the tenant
      await storage.createPolicy({
        tenantId: tenant.id,
        name: "Default Policy",
        enforcementMode: req.body.enforcementMode || "monitor",
        blockThreshold: req.body.blockThreshold || 70,
        challengeThreshold: 50,
        monitorThreshold: 30,
        rateLimit: 100,
        rateLimitWindow: 60,
        isDefault: true,
      });
      
      res.status(201).json(tenant);
    } catch (error) {
      console.error("Error creating tenant:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create tenant" });
    }
  });

  app.patch("/api/tenants/:id", requireRole("admin"), async (req, res) => {
    try {
      const tenant = await storage.updateTenant(req.params.id, req.body);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      
      // If policy-related settings are included, update the tenant's default policy
      if (req.body.enforcementMode || req.body.blockThreshold !== undefined || req.body.challengeThreshold !== undefined || req.body.monitorThreshold !== undefined) {
        const policy = await storage.getPolicyByTenant(req.params.id);
        if (policy) {
          await storage.updatePolicy(policy.id, {
            enforcementMode: req.body.enforcementMode || policy.enforcementMode,
            blockThreshold: req.body.blockThreshold !== undefined ? req.body.blockThreshold : policy.blockThreshold,
            challengeThreshold: req.body.challengeThreshold !== undefined ? req.body.challengeThreshold : policy.challengeThreshold,
            monitorThreshold: req.body.monitorThreshold !== undefined ? req.body.monitorThreshold : policy.monitorThreshold,
          });
        }
      }
      
      res.json(tenant);
    } catch (error) {
      console.error("Error updating tenant:", error);
      res.status(500).json({ message: "Failed to update tenant" });
    }
  });

  app.delete("/api/tenants/:id", requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteTenant(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tenant:", error);
      res.status(500).json({ message: "Failed to delete tenant" });
    }
  });

  // Tenant Policy
  app.get("/api/tenants/:id/policy", requireAuth, async (req, res) => {
    try {
      const policy = await storage.getPolicyByTenant(req.params.id);
      if (!policy) {
        return res.status(404).json({ message: "Policy not found" });
      }
      res.json(policy);
    } catch (error) {
      console.error("Error fetching tenant policy:", error);
      res.status(500).json({ message: "Failed to fetch policy" });
    }
  });

  // Tenant Requests
  app.get("/api/tenants/:id/requests", requireAuth, async (req, res) => {
    try {
      const requests = await storage.getRequestsWithAnalysis(req.params.id);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching tenant requests:", error);
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  // Policies
  app.get("/api/policies", requireAuth, async (req, res) => {
    try {
      const policies = await storage.getPolicies();
      res.json(policies);
    } catch (error) {
      console.error("Error fetching policies:", error);
      res.status(500).json({ message: "Failed to fetch policies" });
    }
  });

  app.get("/api/policies/:id", requireAuth, async (req, res) => {
    try {
      const policy = await storage.getPolicy(req.params.id);
      if (!policy) {
        return res.status(404).json({ message: "Policy not found" });
      }
      res.json(policy);
    } catch (error) {
      console.error("Error fetching policy:", error);
      res.status(500).json({ message: "Failed to fetch policy" });
    }
  });

  app.patch("/api/policies/:id", requireRole("admin", "operator"), async (req, res) => {
    try {
      const policy = await storage.updatePolicy(req.params.id, req.body);
      if (!policy) {
        return res.status(404).json({ message: "Policy not found" });
      }
      res.json(policy);
    } catch (error) {
      console.error("Error updating policy:", error);
      res.status(500).json({ message: "Failed to update policy" });
    }
  });

  // WAF Rules
  app.get("/api/rules", requireAuth, async (req, res) => {
    try {
      const rules = await storage.getRules();
      res.json(rules);
    } catch (error) {
      console.error("Error fetching rules:", error);
      res.status(500).json({ message: "Failed to fetch rules" });
    }
  });

  app.get("/api/rules/:id", requireAuth, async (req, res) => {
    try {
      const rule = await storage.getRule(req.params.id);
      if (!rule) {
        return res.status(404).json({ message: "Rule not found" });
      }
      res.json(rule);
    } catch (error) {
      console.error("Error fetching rule:", error);
      res.status(500).json({ message: "Failed to fetch rule" });
    }
  });

  app.post("/api/rules", requireRole("admin"), async (req, res) => {
    try {
      const data = insertWafRuleSchema.parse(req.body);
      const rule = await storage.createRule(data);
      res.status(201).json(rule);
    } catch (error) {
      console.error("Error creating rule:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create rule" });
    }
  });

  app.patch("/api/rules/:id", requireRole("admin"), async (req, res) => {
    try {
      const rule = await storage.updateRule(req.params.id, req.body);
      if (!rule) {
        return res.status(404).json({ message: "Rule not found" });
      }
      res.json(rule);
    } catch (error) {
      console.error("Error updating rule:", error);
      res.status(500).json({ message: "Failed to update rule" });
    }
  });

  app.delete("/api/rules/:id", requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteRule(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting rule:", error);
      res.status(500).json({ message: "Failed to delete rule" });
    }
  });

  // Requests
  app.get("/api/requests", requireAuth, async (req, res) => {
    try {
      const { tenantId, ip, path, method, scoreMin, scoreMax } = req.query;
      let requests = await storage.getRequestsWithAnalysis(tenantId as string);
      
      // Apply filters
      if (ip) requests = requests.filter(r => r.clientIp?.includes(ip as string));
      if (path) requests = requests.filter(r => r.path.includes(path as string));
      if (method) requests = requests.filter(r => r.method === method);
      
      res.json(requests);
    } catch (error) {
      console.error("Error fetching requests:", error);
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  app.get("/api/requests/:id", requireAuth, async (req, res) => {
    try {
      const request = await storage.getRequestWithAnalysis(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("Error fetching request:", error);
      res.status(500).json({ message: "Failed to fetch request" });
    }
  });

  app.post("/api/requests/:id/override", requireRole("admin", "operator"), async (req, res) => {
    try {
      const request = await storage.getRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      const override = await storage.createOverride({
        overrideType: "request",
        targetId: req.params.id,
        tenantId: request.tenantId,
        action: req.body.action,
        operatorId: (req.user as any).id,
        reason: req.body.reason,
      });
      
      res.status(201).json(override);
    } catch (error) {
      console.error("Error creating override:", error);
      res.status(500).json({ message: "Failed to create override" });
    }
  });

  // Whitelist IP - add to allow list
  app.post("/api/requests/:id/whitelist-ip", requireRole("admin", "operator"), async (req, res) => {
    try {
      const request = await storage.getRequest(req.params.id);
      if (!request || !request.clientIp) {
        return res.status(404).json({ message: "Request not found or has no IP" });
      }
      
      await storage.createIpList({
        tenantId: request.tenantId,
        listType: "whitelist",
        ipAddress: request.clientIp,
        reason: req.body.reason || "Whitelisted from request detail",
      });
      
      res.status(201).json({ message: "IP whitelisted successfully" });
    } catch (error) {
      console.error("Error whitelisting IP:", error);
      res.status(500).json({ message: "Failed to whitelist IP" });
    }
  });

  // Blacklist IP - add to deny list
  app.post("/api/requests/:id/blacklist-ip", requireRole("admin", "operator"), async (req, res) => {
    try {
      const request = await storage.getRequest(req.params.id);
      if (!request || !request.clientIp) {
        return res.status(404).json({ message: "Request not found or has no IP" });
      }
      
      await storage.createIpList({
        tenantId: request.tenantId,
        listType: "blacklist",
        ipAddress: request.clientIp,
        reason: req.body.reason || "Blacklisted from request detail",
      });
      
      res.status(201).json({ message: "IP blacklisted successfully" });
    } catch (error) {
      console.error("Error blacklisting IP:", error);
      res.status(500).json({ message: "Failed to blacklist IP" });
    }
  });

  // Create rule from request
  app.post("/api/requests/:id/create-rule", requireRole("admin", "operator"), async (req, res) => {
    try {
      const request = await storage.getRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      const rule = await storage.createRule({
        tenantId: request.tenantId,
        name: req.body.name,
        category: req.body.category || "custom",
        pattern: req.body.pattern || request.path,
        targetField: req.body.targetField || "request",
        description: req.body.description || `Custom rule created from request`,
        severity: req.body.severity || "medium",
        enabled: true,
      });
      
      res.status(201).json(rule);
    } catch (error) {
      console.error("Error creating rule:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create rule" });
    }
  });

  // Alerts
  app.get("/api/alerts", requireAuth, async (req, res) => {
    try {
      const alerts = await storage.getAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.get("/api/alerts/recent", requireAuth, async (req, res) => {
    try {
      const alerts = await storage.getAlerts();
      res.json(alerts.slice(0, 5));
    } catch (error) {
      console.error("Error fetching recent alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.patch("/api/alerts/:id", requireAuth, async (req, res) => {
    try {
      const alert = await storage.updateAlert(req.params.id, req.body);
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      console.error("Error updating alert:", error);
      res.status(500).json({ message: "Failed to update alert" });
    }
  });

  app.post("/api/alerts/mark-all-read", requireAuth, async (req, res) => {
    try {
      await storage.markAllAlertsRead();
      res.status(204).send();
    } catch (error) {
      console.error("Error marking alerts as read:", error);
      res.status(500).json({ message: "Failed to mark alerts as read" });
    }
  });

  app.post("/api/alerts/:id/dismiss", requireAuth, async (req, res) => {
    try {
      const alert = await storage.updateAlert(req.params.id, { isDismissed: true });
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      console.error("Error dismissing alert:", error);
      res.status(500).json({ message: "Failed to dismiss alert" });
    }
  });

  // Webhooks
  app.get("/api/webhooks", requireRole("admin"), async (req, res) => {
    try {
      const webhooks = await storage.getWebhooks();
      res.json(webhooks);
    } catch (error) {
      console.error("Error fetching webhooks:", error);
      res.status(500).json({ message: "Failed to fetch webhooks" });
    }
  });

  app.post("/api/webhooks", requireRole("admin"), async (req, res) => {
    try {
      const webhook = await storage.createWebhook(req.body);
      res.status(201).json(webhook);
    } catch (error) {
      console.error("Error creating webhook:", error);
      res.status(500).json({ message: "Failed to create webhook" });
    }
  });

  app.patch("/api/webhooks/:id", requireRole("admin"), async (req, res) => {
    try {
      const webhook = await storage.updateWebhook(req.params.id, req.body);
      if (!webhook) {
        return res.status(404).json({ message: "Webhook not found" });
      }
      res.json(webhook);
    } catch (error) {
      console.error("Error updating webhook:", error);
      res.status(500).json({ message: "Failed to update webhook" });
    }
  });

  app.delete("/api/webhooks/:id", requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteWebhook(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting webhook:", error);
      res.status(500).json({ message: "Failed to delete webhook" });
    }
  });

  // Export endpoints
  app.get("/api/export/csv", requireAuth, async (req, res) => {
    try {
      const { tenantId, startDate, endDate } = req.query;
      const reqs = await storage.getRequestsForExport(
        tenantId as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      let csv = "ID,Timestamp,ClientIP,Method,Path,StatusCode,ActionTaken,Score\n";
      for (const req of reqs) {
        csv += `"${req.id}","${req.timestamp}","${req.clientIp || 'N/A'}","${req.method}","${req.path}",${req.responseCode || 'N/A'},"${req.actionTaken}",0\n`;
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=requests_export.csv");
      res.send(csv);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      res.status(500).json({ message: "Failed to export CSV" });
    }
  });

  app.get("/api/export/json", requireAuth, async (req, res) => {
    try {
      const { tenantId, startDate, endDate } = req.query;
      const reqs = await storage.getRequestsForExport(
        tenantId as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", "attachment; filename=requests_export.json");
      res.json({ exports: reqs, totalRecords: reqs.length });
    } catch (error) {
      console.error("Error exporting JSON:", error);
      res.status(500).json({ message: "Failed to export JSON" });
    }
  });

  // Users
  app.get("/api/users", requireRole("admin"), async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/users/:id", requireRole("admin"), async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Settings
  app.get("/api/settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", requireRole("admin"), async (req, res) => {
    try {
      const settings = await storage.updateSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // WAF Ingress endpoint - analyze, store, and broadcast incoming requests
  // This endpoint receives proxied requests from upstream (e.g., nginx, load balancer)
  app.post("/api/waf/ingress", async (req, res) => {
    try {
      const { tenantId, request: incomingRequest } = req.body;
      
      if (!tenantId || !incomingRequest) {
        return res.status(400).json({ message: "tenantId and request are required" });
      }
      
      const tenant = await storage.getTenant(tenantId);
      if (!tenant || !tenant.isActive) {
        return res.status(404).json({ message: "Tenant not found or inactive" });
      }
      
      // Get policy thresholds
      const policy = await storage.getPolicyByTenant(tenantId);
      const thresholds = {
        blockThreshold: policy?.blockThreshold ?? 70,
        challengeThreshold: policy?.challengeThreshold ?? 50,
        monitorThreshold: policy?.monitorThreshold ?? 30,
      };
      
      // Load WAF rules
      const customRules = await storage.getRulesByTenant(tenantId);
      const globalRules = await storage.getRulesByTenant(null);
      wafEngine.setCustomRules([...globalRules, ...customRules]);
      
      // Analyze the request
      const analysis = wafEngine.analyzeRequest(incomingRequest, thresholds);
      
      // Determine response code based on action
      const responseCode = analysis.action === "block" ? 403 
        : analysis.action === "challenge" ? 429 
        : 200;
      
      // Apply privacy settings: scrub sensitive headers
      let headersToStore = incomingRequest.headers || {};
      if ((tenant.scrubCookies ?? false) || (tenant.scrubAuthHeaders ?? false)) {
        headersToStore = scrubHeaders(headersToStore, tenant.scrubCookies ?? false, tenant.scrubAuthHeaders ?? false);
      }
      
      // Store the request
      const storedRequest = await storage.createRequest({
        tenantId,
        timestamp: new Date(),
        method: incomingRequest.method,
        path: incomingRequest.path,
        clientIp: incomingRequest.clientIp,
        userAgent: incomingRequest.headers?.["user-agent"],
        responseCode,
        actionTaken: analysis.action === "block" ? "deny" : analysis.action as any,
        headersJson: headersToStore,
        bodyPreview: incomingRequest.body?.substring(0, 500) || null,
        queryString: Object.entries(incomingRequest.query || {})
          .map(([k, v]) => `${k}=${v}`).join("&") || null,
        wafHitsJson: analysis.matches,
      });
      
      // Store analysis record
      await storage.createAnalysis({
        requestId: storedRequest.id,
        matchedRulesJson: analysis.matches,
        totalScore: analysis.score,
        suggestedAction: analysis.action === "block" ? "deny" : analysis.action as any,
        finalAction: analysis.action === "block" ? "deny" : analysis.action as any,
        processingTimeMs: analysis.processingTimeMs,
        breakdownJson: { riskLevel: analysis.riskLevel, matchCount: analysis.matches.length },
      });
      
      // Broadcast to SSE clients
      sseServer.broadcastRequest(storedRequest);
      
      // Create alert for high-risk requests
      if (analysis.score >= 70) {
        const alert = await storage.createAlert({
          tenantId,
          severity: analysis.riskLevel,
          type: analysis.matches[0]?.category || "unknown",
          title: `High-risk request detected (Score: ${analysis.score})`,
          message: `Detected ${analysis.matches.length} rule matches: ${analysis.matches.slice(0, 3).map(m => m.ruleName).join(", ")}${analysis.matches.length > 3 ? '...' : ''}`,
        });
        
        sseServer.broadcastAlert({
          id: alert.id,
          severity: alert.severity,
          message: alert.title,
          tenantId,
        });
      }
      
      // Return analysis result for upstream to act upon
      res.json({
        requestId: storedRequest.id,
        action: analysis.action,
        score: analysis.score,
        riskLevel: analysis.riskLevel,
        matchCount: analysis.matches.length,
        processingTimeMs: analysis.processingTimeMs,
      });
    } catch (error) {
      console.error("Error processing WAF ingress:", error);
      res.status(500).json({ message: "WAF processing error" });
    }
  });

  // WAF Analysis endpoint - analyze a request without storing it
  app.post("/api/waf/analyze", requireAuth, async (req, res) => {
    try {
      const { tenantId, request: wafRequest } = req.body;
      
      const tenant = await storage.getTenant(tenantId);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      
      const policy = await storage.getPolicyByTenant(tenantId);
      const thresholds = {
        blockThreshold: policy?.blockThreshold ?? 70,
        challengeThreshold: policy?.challengeThreshold ?? 50,
        monitorThreshold: policy?.monitorThreshold ?? 30,
      };
      
      const customRules = await storage.getRulesByTenant(tenantId);
      const globalRules = await storage.getRulesByTenant(null);
      wafEngine.setCustomRules([...globalRules, ...customRules]);
      
      const result = wafEngine.analyzeRequest(wafRequest, thresholds);
      
      res.json(result);
    } catch (error) {
      console.error("Error analyzing request:", error);
      res.status(500).json({ message: "Failed to analyze request" });
    }
  });

  // Start background jobs
  startDataRetentionJob();

  // CORS preflight for SSE endpoint
  app.options("/api/traffic/stream", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.sendStatus(204);
  });

  // SSE stream endpoint for live traffic updates
  app.get("/api/traffic/stream", requireAuth, (req, res) => {
    // Disable timeouts for long-lived SSE connections
    req.socket?.setTimeout(0);
    res.socket?.setTimeout(0);
    
    const clientId = sseServer.registerClient(res);
    console.log(`[SSE] Stream endpoint: ${clientId} connected`);
  });

  // SSE status endpoint
  app.get("/api/sse/status", requireAuth, async (req, res) => {
    res.json({
      clients: sseServer.getClientCount(),
      status: "active",
    });
  });

  const httpServer = createServer(app);

  // Start WAF reverse proxy (if configured)
  await startWafProxy();

  return httpServer;
}
