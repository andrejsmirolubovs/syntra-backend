import express from "express";
import { saveCache, saveSnapshot } from "../services/cache.js";

const router = express.Router();

/**
 * POST /api/ingest/tokens
 * Этот маршрут вызывается n8n, когда данные готовы
 */
router.post("/ingest/tokens", async (req, res) => {
  try {
    const { wallet, total_usd, data } = req.body;

    if (!wallet || !total_usd || !data) {
      return res.status(400).json({
        ok: false,
        error: "wallet, total_usd and data are required"
      });
    }

    // Обновляем кэш
    await saveCache(wallet.toLowerCase(), {
      total_usd,
      ...data
    });

    // Записываем snapshot (история)
    await saveSnapshot(wallet.toLowerCase(), total_usd);

    return res.json({ ok: true });

  } catch (err) {
    console.error("Ingest route error:", err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

export default router;
