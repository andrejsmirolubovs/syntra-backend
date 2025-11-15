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
  const blocked = [
    "test",
    "sepolia",
    "fuji",
    "amoy",
    "curtis",
    "bokuto",
    "alpha",
    "hoodi",
    "hoody",
    "bepolia",
    "apothem",
    "holesky"
  ];

  const mainnets = chains.filter(c => {
    const key = c.chain_key.toLowerCase();
    return !blocked.some(b => key.includes(b));
  });

  res.json({
    ok: true,
    data: mainnets
  });
});



export default router;
