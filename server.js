// ====================================================
// SYNTRA API (Render)
// ====================================================
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import fetch from 'node-fetch'; // только чтобы Render не ругался при билде
import { isAddress } from 'ethers';
import { getUserProtocols, getUserTokens } from './services/debankClient.js';

dotenv.config();
const app = express();

// ====================================================
// 🔹 1. CORS
// ====================================================
const allowedOrigins = ['https://syntra-frontend.onrender.com'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // разрешаем Postman и curl
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
  queueLimit: 0,
});

// ====================================================
// 🔹 3. Health-check (проверка API и БД)
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
// 🔹 4. Главная страница API
// ====================================================
app.get('/', (req, res) => {
  res.json({
    name: 'Syntra API',
    version: '0.2.0',
    status: '✅ online',
    frontend: 'https://syntra-frontend.onrender.com',
  });
});

// ====================================================
// 🔹 5. /defi/:address — сводка из DeBank с кэшем
// ====================================================

// --- вспомогательные функции ---
async function getCache(pool, address) {
  const [rows] = await pool.query(
    'SELECT payload, fetched_at FROM protocol_positions_cache WHERE address=? AND source=? ORDER BY fetched_at DESC LIMIT 1',
    [address, 'debank']
  );
  return rows[0] || null;
}

async function setCache(pool, address, payload) {
  await pool.query(
    'INSERT INTO protocol_positions_cache(address, source, payload) VALUES(?,?,?)',
    [address, 'debank', JSON.stringify(payload)]
  );
}

function normalizeAddress(addr) {
  return String(addr || '').trim().toLowerCase();
}

// --- основной маршрут ---
app.get('/defi/:address', async (req, res) => {
  const address = normalizeAddress(req.params.address);

  if (!isAddress(address)) {
    return res.status(400).json({ ok: false, error: 'Invalid EVM address' });
  }

  const ttlMs = 60_000; // 1 минута кэша
  let cached = null;

  try {
    // 1. Проверяем кэш
    cached = await getCache(pool, address);
    if (cached) {
      const isFresh = Date.now() - new Date(cached.fetched_at).getTime() < ttlMs;
      if (isFresh) {
        return res.json({
          ok: true,
          source: 'cache',
          cached_at: cached.fetched_at,
          data: cached.payload
        });
      }
    }

    // 2. Тянем из DeBank
    const [protocols, tokens] = await Promise.all([
      getUserProtocols(address, 'all'),
      getUserTokens(address, true)
    ]);

    const summary = { protocols, tokens };

    // 3. Сохраняем в кэш
    await setCache(pool, address, summary);

    // 4. Возвращаем
    res.json({
      ok: true,
      source: 'debank',
      cached_at: new Date().toISOString(),
      data: summary
    });
  } catch (e) {
    console.error('[DEF I ERROR]', e.message);

    // если упал DeBank, но есть кэш — отдаём старый
    if (cached) {
      return res.json({
        ok: true,
        source: 'stale-cache',
        cached_at: cached.fetched_at,
        data: cached.payload,
        error: e.message
      });
    }

    res.status(500).json({ ok: false, error: e.message });
  }
});

// ====================================================
// 🔹 6. Запуск сервера
// ====================================================
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`✅ Syntra API running on port ${port}`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
});
