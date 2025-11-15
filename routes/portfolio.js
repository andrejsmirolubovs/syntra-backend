// routes/portfolio.js
import express from 'express';
import { getPortfolio } from '../services/cache.js';
import { triggerSyncInN8N } from '../services/syncRequest.js';

const router = express.Router();

router.get('/portfolio/:wallet', async (req, res) => {
  const wallet = req.params.wallet.toLowerCase();

  const data = await getPortfolio(wallet); // проверка кеша
  if (data.fresh) {
    return res.json(data.payload);
  }

  await triggerSyncInN8N(wallet); // вызываем n8n flow

  // после завершения — считываем обновлённый кеш
  const updated = await getPortfolio(wallet);

  res.json(updated.payload);
});

export default router;
