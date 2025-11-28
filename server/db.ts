import { Sequelize } from "sequelize";
import path from "path";
import { initializeModels, User, Tenant } from "./models";

// Use SQLite for development/demo
const dbPath = path.resolve(process.cwd(), "waf.db");

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: dbPath,
  logging: false, // Set to console.log to see SQL queries
  sync: { alter: true }, // Auto-sync models with database
});

// Initialize flags
let initialized = false;
let seeded = false;
let demoSiteSeeded = false;

// Seed default users
async function seedDefaultUsers() {
  try {
    const defaultUsers: Array<{ email: string; firstName: string; lastName: string; role: "admin" | "operator" | "viewer" }> = [
      {
        email: "admin@waf.local",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
      },
      {
        email: "operator@waf.local",
        firstName: "Operator",
        lastName: "User",
        role: "operator",
      },
      {
        email: "viewer@waf.local",
        firstName: "Viewer",
        lastName: "User",
        role: "viewer",
      },
    ];

    for (const userData of defaultUsers) {
      const exists = await User.findOne({ where: { email: userData.email } });
      if (!exists) {
        await User.create(userData);
        console.log(`✅ Created user: ${userData.email}`);
      }
    }
  } catch (error) {
    console.error("❌ Error seeding users:", error);
  }
}

// Seed demo website
async function seedDemoWebsite() {
  try {
    const demoWebsite = {
      name: "Demo Target App",
      domain: "demo.waf.local",
      upstreamUrl: "http://10.1.40.99:3001",
      sslEnabled: false,
      isActive: true,
      retentionDays: 30,
      anonymizeIpAfterDays: 7,
      scrubCookies: true,
      scrubAuthHeaders: true,
    };

    const exists = await Tenant.findOne({ where: { domain: demoWebsite.domain } });
    if (!exists) {
      const created = await Tenant.create(demoWebsite as any);
      console.log(`✅ Created demo website: ${demoWebsite.name} (${demoWebsite.upstreamUrl})`);
      return created.id;
    } else {
      // Update upstream URL in case it changed
      await exists.update({ upstreamUrl: demoWebsite.upstreamUrl });
      console.log(`✅ Demo website already exists: ${demoWebsite.name}`);
      return exists.id;
    }
  } catch (error) {
    console.error("❌ Error seeding demo website:", error);
  }
}

// Initialize performance optimizations
async function initializePerformanceOptimizations() {
  try {
    // Add indexes for faster queries
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain)`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(isActive)`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_policies_tenant ON policies(tenantId)`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_rules_tenant ON waf_rules(tenantId)`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_alerts_tenant ON alerts(tenantId)`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_requests_tenant ON requests(tenantId)`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_requests_created ON requests(createdAt)`);
    console.log("✅ Database indexes created for faster queries");
  } catch (error) {
    console.error("Index creation note:", (error as any).message?.substring(0, 50));
  }
}

// Sync database
export async function syncDatabase() {
  try {
    // Initialize models only once
    if (!initialized) {
      initializeModels();
      initialized = true;
    }

    await sequelize.authenticate();
    console.log("✅ SQLite database connected");
    
    // Disable foreign key constraints for SQLite sync
    await sequelize.query("PRAGMA foreign_keys = OFF");
    
    try {
      await sequelize.sync({ alter: true });
      console.log("✅ Database tables synchronized");
      
      // Initialize performance optimizations
      await initializePerformanceOptimizations();
      
      // Seed default users and demo website (only once)
      if (!seeded) {
        await seedDefaultUsers();
        await seedDemoWebsite();
        seeded = true;
      }
    } finally {
      // Re-enable foreign key constraints
      await sequelize.query("PRAGMA foreign_keys = ON");
    }
  } catch (error) {
    console.error("❌ Database error:", error);
    throw error;
  }
}

// Export for backward compatibility
export const db = sequelize;

// Export sequelize for global use
export default sequelize;
