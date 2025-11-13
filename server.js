// ====================================================
// SYNTRA CORE API v1 (Render + Neon PostgreSQL)
// ====================================================
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
import fetch from 'node-fetch';
import { isAddress } from 'ethers';

dotenv.config();
const app = express();
const { Pool } = pkg;

// ====================================================
// 🔹 1. CORS
// ====================================================
const allowedOrigins = [
  'https://syntra-frontend.onrender.com',
  'https://syntra-dev.dayincrypto.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
}));

app.use(express.json());

// ====================================================
// 🔹 2. Подключение к базе (Neon PostgreSQL)
// ====================================================
if (!process.env.DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL not found in environment variables");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

console.log("📦 Connected to Neon PostgreSQL");

// ====================================================
// 🔹 3. Health-check
// ====================================================
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ ok: true, db_time: result.rows[0].now });
  } catch (e) {
    console.error('[HEALTH ERROR]', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ====================================================
// 🔹 4. Главная
// ====================================================
app.get('/', (req, res) => {
  res.json({
    name: 'Syntra API',
    version: '1.0.0',
    status: '✅ online',
    frontend: 'https://syntra-frontend.onrender.com',
  });
});

// ====================================================
// 🔹 5. Portfolio Snapshots
// ====================================================

// POST /api/portfolio/upsert
app.post('/api/portfolio/upsert', async (req, res) => {
  try {
    const { wallet, total_value_usd, total_debt_usd, health_factor, avg_apy, pnl_percent, raw } = req.body;
    if (!wallet) return res.status(400).json({ ok: false, error: 'wallet is required' });

    const sql = `
      INSERT INTO portfolio_snapshots
        (wallet, total_value_usd, total_debt_usd, health_factor, avg_apy, pnl_percent, raw_json)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    const params = [
      wallet.toLowerCase(),
      Number(total_value_usd || 0),
      Number(total_debt_usd || 0),
      Number(health_factor || 0),
      Number(avg_apy || 0),
      Number(pnl_percent || 0),
      raw ? JSON.stringify(raw) : null
    ];

    await pool.query(sql, params);
    res.json({ ok: true });
  } catch (e) {
    console.error('[UPSERT ERROR]', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/portfolio/latest?wallet=0x...
app.get('/api/portfolio/latest', async (req, res) => {
  try {
    const wallet = (req.query.wallet || '').toLowerCase();
    if (!isAddress(wallet)) return res.status(400).json({ ok: false, error: 'Invalid wallet' });

    const sql = `
      SELECT * FROM portfolio_snapshots
      WHERE wallet = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await pool.query(sql, [wallet]);
    res.json({ ok: true, data: result.rows[0] || null });
  } catch (e) {
    console.error('[LATEST ERROR]', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ====================================================
// 🔹 7. Запуск сервера
// ====================================================
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`✅ Syntra API v1 running on port ${port}`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
});
