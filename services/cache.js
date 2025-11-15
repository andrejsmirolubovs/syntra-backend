// services/cache.js
import { pool } from "../db.js";

const FRESH_TIME_MS = 5 * 60 * 1000; // 5 минут

// Проверяем, свежий ли кэш
export function isCacheFresh(updated_at) {
  if (!updated_at) return false;
  const age = Date.now() - new Date(updated_at).getTime();
  return age < FRESH_TIME_MS;
}

// Получить кэш по кошельку
export async function getCache(wallet) {
  const sql = `
    SELECT data, total_usd, updated_at
    FROM wallet_cache
    WHERE wallet = $1
  `;
  const res = await pool.query(sql, [wallet]);
  return res.rows.length ? res.rows[0] : null;
}

// Сохранить кэш
export async function saveCache(wallet, payload) {
  const total_usd = payload.total_usd || 0;
  const data = payload;

  const sql = `
    INSERT INTO wallet_cache (wallet, data, total_usd, updated_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (wallet)
    DO UPDATE SET data=$2, total_usd=$3, updated_at=NOW()
  `;

  await pool.query(sql, [wallet, data, total_usd]);
  return true;
}

// Сохранить snapshot истории
export async function saveSnapshot(wallet, total_usd) {
  const sql = `
    INSERT INTO wallet_snapshots (wallet, total_usd, taken_at)
    VALUES ($1, $2, NOW())
  `;
  await pool.query(sql, [wallet, total_usd]);
}
