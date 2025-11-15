// routes/ingest.js
import express from 'express';
import { saveCache, saveSnapshot } from '../services/cache.js';

const router = express.Router();

router.post('/ingest/tokens', async (req, res) => {
  const tokens = req.body.tokens;
  const wallet = req.body.wallet;

  await saveCache(wallet, tokens);

  res.json({ ok: true });
});

router.post('/ingest/snapshot', async (req, res) => {
  const { wallet, total_usd } = req.body;

  await saveSnapshot(wallet, total_usd);

  res.json({ ok: true });
});

export default router;
