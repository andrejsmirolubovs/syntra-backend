import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

// Фикс для __dirname в ES-модулях
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Читаем chains.json вручную
const chainsPath = path.join(__dirname, "../config/chains.json");
const chains = JSON.parse(fs.readFileSync(chainsPath, "utf8"));

// GET /api/chains
router.get("/chains", (req, res) => {
  try {
    return res.json({
      ok: true,
      data: chains
    });
  } catch (e) {
    console.error("Chains route error:", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
