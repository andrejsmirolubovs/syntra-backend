import express from "express";
import { isAddress } from "ethers";
import { getCache, isCacheFresh } from "../services/cache.js";
import { triggerSyncInN8N } from "../services/syncRequest.js";

const router = express.Router();

/**
 * GET /api/portfolio/:wallet
 * Основная точка входа фронтенда
 */
router.get("/portfolio/:wallet", async (req, res) => {
  try {
    const wallet = req.params.wallet.toLowerCase();

    // Проверяем валидность адреса
    if (!isAddress(wallet)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid wallet address"
      });
    }

    // Проверяем кэш
    const cached = await getCache(wallet);

    if (cached && isCacheFresh(cached.updated_at)) {
      // Кэш свежий → сразу отдаём данные
      return res.json({
        ok: true,
        status: "ok",
        source: "cache",
        updated_at: cached.updated_at,
        total_usd: Number.total_usd,
        data: cached.data
      });
    }

    // Кэш устарел → запускаем обновление в n8n
    await triggerSyncInN8N(wallet);

    // Возвращаем PENDING
    return res.json({
      ok: true,
      status: "pending",
      message: "Updating portfolio data...",
      wallet
    });

  } catch (err) {
    console.error("Portfolio route error:", err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

export default router;
