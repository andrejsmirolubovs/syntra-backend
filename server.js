import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();
const app = express();

// ================================
// 🔹 CORS — только твой фронт
// ================================
const allowedOrigins = [
  'https://syntra-frontend.onrender.com',   // Render frontend
];

app.use(cors({
  origin: function (origin, callback) {
    // разрешаем запросы без Origin (например из Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
}));

app.use(express.json());

// ================================
// 🔹 Подключение к MySQL (Hostinger)
// ================================
const pool = mysql.createPool({
  host: process.env.DB_HOST,          // auth-db507.hstgr.io
  user: process.env.DB_USER,          // u363192258_syntra_user
  password: process.env.DB_PASS,      // SyntraDB12345
  database: process.env.DB_NAME,      // u363192258_syntra_db
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

// ================================
// 🔹 Проверка состояния API и базы
// ================================
app.get('/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ ok: true, db: rows[0].ok === 1 });
  } catch (e) {
    console.error('[HEALTH ERROR]', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ================================
// 🔹 Главный маршрут
// ================================
app.get('/', (req, res) => {
  res.json({
    name: 'Syntra API',
    version: '0.2.0',
    status: '✅ online',
    frontend: 'https://syntra-frontend.onrender.com',
  });
});

// ================================
// 🔹 Запуск сервера
// ================================
const port = process.env.PORT || 4000;

// ================================
// 🔹 /defi/:address — сводка из DeBank с кэшем
// ================================
import { isAddress } from 'ethers';
import { getUserProtocols, getUserTokens } from './services/debankClient.js';

/** получить свежую запись из кэша */
async function getCache(pool, address) {
  const [rows] = await pool.query(
    'SELECT payload, fetched_at FROM protocol_positions_cache WHERE address=? AND source=? ORDER BY fetched_at DESC LIMIT 1',
    [address, 'debank']
  );
  return rows[0] || null;
}

/** записать кэш */
async function setCache(pool, address, payload) {
  await pool.query(
    'INSERT INTO protocol_positions_cache(address, source, payload) VALUES(?,?,?)',
    [address, 'debank', JSON.stringify(payload)]
  );
}

/** нормализуем адрес (нижний регистр) */
function normAddr(addr) {
  return String(addr).trim().toLowerCase();
}

app.get('/defi/:address', async (req, res) => {
  const addrRaw = req.params.address;
  const address = normAddr(addrRaw);

  if (!isAddress(address)) {
    return res.status(400).json({ ok: false, error: 'Invalid EVM address' });
  }

  const ttlMs = 60_000; // 60 секунд кэш
  let cached = null;

  try {
    // 1) если в кэше свежие данные — отдаём их
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

    // 2) тянем из DeBank
    const [protocols, tokens] = await Promise.all([
      getUserProtocols(address, 'all'),
      getUserTokens(address, true)
    ]);

    // 3) простая сводка (потом расширим)
    const summary = { protocols, tokens };

    // 4) пишем в кэш
    await setCache(pool, address, summary);

    // 5) ответ
    res.json({
      ok: true,
      source: 'debank',
      cached_at: new Date().toISOString(),
      data: summary
    });
  } catch (e) {
    console.error('[DEF I ERROR]', e.message);

    // если DeBank упал, но у нас есть старый кэш — отдадим его
    if (cached) {
      return res.json({
        ok: true,
        source: 'stale-cache',
        cached_at: cached.fetched_at,
        data: cached.payload,
        error: e.message
      });
    }

    // совсем всё плохо
    res.status(500).json({ ok: false, error: e.message });
  }
});


app.listen(port, () => {
  console.log(`✅ Syntra API running on port ${port}`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
});
