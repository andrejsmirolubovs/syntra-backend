// routes/ingest.js
import express from "express";
import { saveCache } from "../services/cache.js";

const router = express.Router();

/**
 * POST /api/ingest/tokens
 * Приём данных из n8n и сохранение в wallet_cache
 */
router.post("/ingest/tokens", async (req, res) => {
  try {
    const { wallet, total_usd, chains, tokens, positions } = req.body;

    if (!wallet) {
      return res.status(400).json({ ok: false, error: "wallet is required" });
    }

    // unified data structure
    const data = {
      chains: chains || [],
      tokens: tokens || [],
      positions: positions || [],
    };

    await saveCache(wallet.toLowerCase(), {
      total_usd: total_usd || 0,
      data,
    });

    console.log("💾 Cache updated for wallet:", wallet);

    return res.json({ ok: true });

  } catch (err) {
    console.error("❌ Ingest error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
