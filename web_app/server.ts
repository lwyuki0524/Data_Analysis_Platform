import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import { initDb } from "./backend/db/database";

// Routes
import datasetRoutes from "./backend/routes/datasetRoutes";
import chatRoutes from "./backend/routes/chatRoutes";
import dashboardRoutes from "./backend/routes/dashboardRoutes";

async function startServer() {
  // Initialize Database
  await initDb();

  const app = express();
  const WEB_APP_PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.use("/api/dataset", datasetRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/dashboard", dashboardRoutes);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(WEB_APP_PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${WEB_APP_PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
