import express from "express";
import { saveCache } from "../services/cache.js";
import { isAddress } from "ethers";

const router = express.Router();

router.post("/ingest/tokens", async (req, res) => {
  try {
    const { wallet, total_usd, chains, tokens, positions } = req.body;

    if (!wallet || !isAddress(wallet)) {
      return res.status(400).json({ ok: false, error: "wallet is required and must be valid" });
    }
    if (total_usd === undefined) {
      return res.status(400).json({ ok: false, error: "total_usd is required" });
    }
    if (!chains || !tokens || !positions) {
      return res.status(400).json({ ok: false, error: "chains, tokens, positions are required" });
    }

    await saveCache(wallet.toLowerCase(), total_usd, {
      chains,
      tokens,
      positions
    });

    return res.json({ ok: true });

  } catch (e) {
    console.error("Ingest error:", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
