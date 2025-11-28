import fs from "node:fs";
import path from "node:path";
import { type Server } from "node:http";

import { nanoid } from "nanoid";
import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { WebSocketServer } from "ws";

import viteConfig from "../vite.config";
import runApp from "./app";

export async function setupVite(app: Express, server: Server) {
  const viteLogger = createLogger();
  const serverOptions = {
    middlewareMode: true,
    hmr: false,
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  
  // Properly handle Vite HMR WebSocket connections
  const hmrWss = new WebSocketServer({ server, path: "/__vite_hmr" });
  
  hmrWss.on("connection", (ws) => {
    // Send initial message to confirm connection
    ws.send(JSON.stringify({ type: "connected", event: { type: "connected" } }));
    
    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        // Handle ping/pong for keep-alive
        if (message.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        }
      } catch (err) {
        // Ignore parse errors
      }
    });
    
    // Send periodic pings to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === 1) { // OPEN
        ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);
    
    ws.on("close", () => {
      clearInterval(pingInterval);
    });
    
    ws.on("error", (err) => {
      clearInterval(pingInterval);
    });
  });
  
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      
      const page = await vite.transformIndexHtml(url, template);
      
      // Inject script to suppress Vite HMR polling console messages
      const suppressHmrScript = `
        <script>
          const originalLog = console.debug;
          const originalError = console.error;
          console.debug = function(...args) {
            if (args[0] && args[0].includes && args[0].includes('[vite]')) return;
            return originalLog.apply(console, args);
          };
          console.error = function(...args) {
            if (args[0] && args[0].includes && args[0].includes('[vite]')) return;
            if (args[0] && args[0].includes && args[0].includes('WebSocket')) return;
            return originalError.apply(console, args);
          };
        </script>
      `;
      
      const modifiedPage = page.replace('</head>', suppressHmrScript + '</head>');
      res.status(200).set({ "Content-Type": "text/html" }).end(modifiedPage);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

(async () => {
  // Initialize database before running app
  const { syncDatabase } = await import("./db");
  await syncDatabase();
  
  await runApp(setupVite);
})();
