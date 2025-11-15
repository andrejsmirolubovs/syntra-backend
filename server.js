// ====================================================
// SYNTRA API — Backend Core (MVP v2)
// ====================================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import { pool } from "./db.js";
import portfolioRoutes from "./routes/portfolio.js";
import ingestRoutes from "./routes/ingest.js";

// ====================================================
// 1. Init express app
// ====================================================
const app = express();
app.use(express.json());

// ====================================================
// 2. CORS
// ====================================================
const allowedOrigins = [
  "https://syntra-frontend.onrender.com",
  "https://syntra-dev.dayincrypto.com"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked: ${origin}`));
    },
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  })
);

// ====================================================
// 3. Validate DB env + connect
// ====================================================
if (!process.env.DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL not found");
  process.exit(1);
}

pool
  .query("SELECT NOW()")
  .then(() => console.log("📦 Connected to Neon PostgreSQL"))
  .catch((err) => {
    console.error("❌ DB connection error:", err.message);
    process.exit(1);
  });

// ====================================================
// 4. Routes
// ====================================================
app.use("/api", portfolioRoutes);
app.use("/api", ingestRoutes);

// ====================================================
// 5. Health-check
// ====================================================
app.get("/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ ok: true, db_time: result.rows[0].now });
  } catch (e) {
    console.error("[HEALTH ERROR]", e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ====================================================
// 6. API Main Page
// ====================================================
app.get("/", (req, res) => {
  res.json({
    name: "Syntra API",
    version: "2.0.0",
    status: "🟢 online",
    networks: "65 networks supported (Etherscan Multichain)",
    frontend: "https://syntra-frontend.onrender.com",
  });
});

// ====================================================
// 7. Start Server
// ====================================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Syntra API running on port ${PORT}`);
});
 