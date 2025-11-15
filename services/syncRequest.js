// services/syncRequest.js
import axios from "axios";

export async function triggerSyncInN8N(wallet) {
  const url = process.env.N8N_SYNC_URL;

  console.log("📡 triggerSyncInN8N() called for wallet:", wallet);
  console.log("🌐 N8N URL:", url);

  try {
    const res = await axios.post(url, { wallet });
    console.log("✅ N8N sync trigger OK:", res.data);
  } catch (err) {
    console.error("❌ N8N sync ERROR:", err?.response?.data || err.message);
  }
}
