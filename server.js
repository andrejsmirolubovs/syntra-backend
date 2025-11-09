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
app.listen(port, () => {
  console.log(`✅ Syntra API running on port ${port}`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
});
