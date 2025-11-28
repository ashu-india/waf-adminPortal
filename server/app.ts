import { type Server } from "node:http";

import express, {
  type Express,
  type Request,
  Response,
  NextFunction,
} from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";

import { registerRoutes } from "./routes";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Session configuration - Using memory store for SQLite
import MemoryStore from "memorystore";
const MemStore = MemoryStore(session);

app.use(
  session({
    store: new MemStore({
      checkPeriod: 86400000, // 24 hours
    }),
    secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  })
);

// Passport configuration
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "email", // For demo, use email as both username and password
    },
    async (email, _, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return done(null, false, { message: "User not found" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.use(passport.initialize());
app.use(passport.session());

// Config endpoint for Replit domain
app.get("/api/config", (req: Request, res: Response) => {
  const replitDomain = process.env.REPLIT_DEV_DOMAIN || null;
  res.json({
    replitDomain,
    isReplit: !!replitDomain,
  });
});

// Security headers middleware
app.use((req, res, next) => {
  // CSP header - allow http/https in development for Vite HMR, restrict to ws/wss in production
  const connectSrc = process.env.NODE_ENV === "production" 
    ? "'self' wss: ws:" 
    : "'self' wss: ws: http: https:";
  
  res.setHeader(
    "Content-Security-Policy",
    `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src ${connectSrc}`
  );
  // HSTS header
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  // X-Frame-Options
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  // X-Content-Type-Options
  res.setHeader("X-Content-Type-Options", "nosniff");
  // X-XSS-Protection
  res.setHeader("X-XSS-Protection", "1; mode=block");
  // Referrer-Policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});


app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

export default async function runApp(
  setup: (app: Express, server: Server) => Promise<void>,
) {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly run the final setup after setting up all the other routes so
  // the catch-all route doesn't interfere with the other routes
  await setup(app, server);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  const host = process.platform === 'win32' ? '127.0.0.1' : '0.0.0.0';
  server.listen(port, host, () => {
    log(`serving on port ${port}`);
  });
}
