import { pool } from "../db.js";

export async function getCache(wallet) {
  const sql = `SELECT * FROM wallet_cache WHERE wallet = $1`;
  const result = await pool.query(sql, [wallet]);
  return result.rows[0] || null;
}

export async function saveCache(wallet, total_usd, data) {
  const sql = `
    INSERT INTO wallet_cache (wallet, total_usd, data, updated_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (wallet)
    DO UPDATE SET
      total_usd = EXCLUDED.total_usd,
      data = EXCLUDED.data,
      updated_at = NOW()
  `;

  await pool.query(sql, [
    wallet,
    Number(total_usd),
    data
  ]);
}

export function isCacheFresh(updated_at) {
  const diff = Date.now() - new Date(updated_at).getTime();
  return diff < 5 * 60 * 1000;
}
