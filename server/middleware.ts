import { Request, Response, NextFunction } from "express";

// Rate limiting store (simple in-memory, can be replaced with Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(windowMs: number = 60000, maxRequests: number = 100) {
  return (req: any, res: any, next: any) => {
    const key = `${req.ip}-${req.path}`;
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (record && record.resetTime > now) {
      if (record.count >= maxRequests) {
        return res.status(429).json({ message: "Too many requests, please try again later" });
      }
      record.count++;
    } else {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    }

    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      const entries = Array.from(rateLimitStore.entries());
      for (const [k, v] of entries) {
        if (v.resetTime < now) {
          rateLimitStore.delete(k);
        }
      }
    }

    next();
  };
}

export function requireRole(...roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden - Insufficient permissions" });
    }
    next();
  };
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[&<>"']/g, (char) => {
      const escapeMap: { [key: string]: string } = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
      };
      return escapeMap[char];
    });
}
