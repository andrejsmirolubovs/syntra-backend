// routes/ingest.js
import express from "express";
import { saveCache } from "../services/cache.js";

const router = express.Router();

router.post("/ingest/tokens", async (req, res) => {
  try {
    const { wallet, total_usd, chains, tokens, positions } = req.body;

    if (!wallet || total_usd === undefined) {
      return res.status(400).json({
        ok: false,
        error: "wallet and total_usd are required"
      });
    }

    const data = {
      chains: chains || [],
      tokens: tokens || [],
      positions: positions || []
    };

    await saveCache(wallet.toLowerCase(), total_usd, data);

    return res.json({ ok: true });
  } catch (err) {
    console.error("INGEST ERROR:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
