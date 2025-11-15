// services/syncRequest.js
import axios from 'axios';

export async function triggerSyncInN8N(wallet) {
  const url = process.env.N8N_SYNC_URL; // добавь в .env

  await axios.post(url, { wallet });
}
