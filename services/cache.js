// services/cache.js
import { pool } from "../db.js";

const FRESH_TIME = 5 * 60 * 1000; // 5 минут

export async function getPortfolio(wallet) {
  const res = await pool.query(
    'SELECT data, total_usd, updated_at FROM wallet_cache WHERE wallet=$1',
    [wallet]
  );

  if (res.rows.length === 0) return { fresh: false };

  const { data, total_usd, updated_at } = res.rows[0];
  const age = Date.now() - new Date(updated_at).getTime();

  if (age < FRESH_TIME) {
    return {
      fresh: true,
      payload: { wallet, total_usd, ...data }
    };
  }

  return { fresh: false };
}

export async function saveCache(wallet, tokens) {
  const total = tokens.reduce(
    (sum, t) => sum + (t.value_usd || 0),
    0
  );

  const data = {
    wallet,
    tokens
  };

  await pool.query(
    `INSERT INTO wallet_cache (wallet, data, total_usd, updated_at)
     VALUES ($1,$2,$3,NOW())
     ON CONFLICT (wallet)
     DO UPDATE SET data=$2, total_usd=$3, updated_at=NOW()`,
    [wallet, data, total]
  );
}

export async function saveSnapshot(wallet, total_usd) {
  await pool.query(
    `INSERT INTO wallet_snapshots (wallet, total_usd, taken_at)
     VALUES ($1,$2,NOW())`,
    [wallet, total_usd]
  );
}
