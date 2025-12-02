import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve Flutter web app from /flutter/ path
  const flutterPath = path.resolve(__dirname, "..", "flutter_app", "build", "web");
  if (fs.existsSync(flutterPath)) {
    app.use("/flutter", express.static(flutterPath));
    
    // Handle Flutter SPA routing
    app.use("/flutter/*", (_req, res) => {
      res.sendFile(path.resolve(flutterPath, "index.html"));
    });
  }

  // Serve React app
  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist (React SPA)
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
