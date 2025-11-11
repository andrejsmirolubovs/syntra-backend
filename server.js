// ====================================================
// SYNTRA CORE API v1 (Render)
// ====================================================
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import fetch from 'node-fetch'; // чтобы Render не ругался
import { isAddress } from 'ethers';

dotenv.config();
const app = express();

// ====================================================
// 🔹 1. CORS
// ====================================================
const allowedOrigins = [
  'https://syntra-frontend.onrender.com',
  'https://syntra-dev.dayincrypto.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Postman / curl
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
}));

app.use(express.json());

// ====================================================
// 🔹 2. Подключение к базе (Hostinger MySQL)
// ====================================================
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'auth-db507.hstgr.io',
  user: process.env.DB_USER || 'u363192258_syntra_user',
  password: process.env.DB_PASS || 'SyntraDB12345',
  database: process.env.DB_NAME || 'u363192258_syntra_db',
  waitForConnections: true,
  connectionLimit: 5,
});

// ====================================================
// 🔹 3. Health-check
// ====================================================
app.get('/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ ok: true, db: rows[0].ok === 1 });
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
// 🔹 5. Portfolio Snapshots (Covalent + CoinGecko)
// ====================================================

// POST /api/portfolio/upsert
app.post('/api/portfolio/upsert', async (req, res) => {
  try {
    const { wallet, total_value_usd, total_debt_usd, health_factor, avg_apy, pnl_percent, raw } = req.body;
    if (!wallet) return res.status(400).json({ ok: false, error: 'wallet is required' });

    const sql = `
      INSERT INTO portfolio_snapshots
        (wallet, total_value_usd, total_debt_usd, health_factor, avg_apy, pnl_percent, raw_json)
      VALUES (?,?,?,?,?,?,?)
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

    const [rows] = await pool.query(
      `SELECT * FROM portfolio_snapshots
       WHERE wallet = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [wallet]
    );

    res.json({ ok: true, data: rows[0] || null });
  } catch (e) {
    console.error('[LATEST ERROR]', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ====================================================
// 🔹 6. Старый DeBank Endpoint (отключен, чтобы не ломался билд)
// ====================================================
app.get('/defi/:address', async (req, res) => {
  res.json({
    ok: false,
    disabled: true,
    message: 'DeBank integration disabled in Syntra Core v1',
  });
});

// ====================================================
// 🔹 7. Запуск сервера
// ====================================================
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`✅ Syntra API v1 running on port ${port}`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
});
