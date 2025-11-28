import { storage } from "./storage";

export async function startDataRetentionJob() {
  // Run every 6 hours
  setInterval(async () => {
    try {
      console.log("Running data retention job...");
      const allTenants = await storage.getTenants();
      
      for (const tenant of allTenants) {
        const retentionDays = tenant.retentionDays || 30;
        const deleted = await storage.deleteOldRequests(tenant.id, retentionDays);
        if (deleted > 0) {
          console.log(`Deleted ${deleted} old requests for tenant ${tenant.id}`);
        }

        // Anonymize old IPs
        const anonymizeDays = tenant.anonymizeIpAfterDays || 7;
        const anonymized = await storage.anonymizeOldIPs(tenant.id, anonymizeDays);
        if (anonymized > 0) {
          console.log(`Anonymized ${anonymized} old IPs for tenant ${tenant.id}`);
        }
      }
    } catch (error) {
      console.error("Data retention job failed:", error);
    }
  }, 6 * 60 * 60 * 1000); // 6 hours
}

export async function triggerWebhooks(alertId: string, severity: string) {
  try {
    const allWebhooks = await storage.getWebhooks();
    const relevantWebhooks = allWebhooks.filter((w) => w.isActive);

    for (const webhook of relevantWebhooks) {
      try {
        await fetch(webhook.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            alertId,
            severity,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (error) {
        console.error(`Webhook delivery failed for ${webhook.url}:`, error);
      }
    }
  } catch (error) {
    console.error("Failed to trigger webhooks:", error);
  }
}
