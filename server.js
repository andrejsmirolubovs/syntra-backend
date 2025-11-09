import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();
const app = express();

// ✅ Разрешаем запросы с фронтенда на Hostinger и Render
app.use(cors({
  origin: [
    'https://syntra-dev.dayincrypto.com',
    'https://syntra-frontend.onrender.com',
    'http://syntra-dev.dayincrypto.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.use(express.json());

// ✅ Подключение к базе данных (если нужно, можно оставить пустым)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || '',
  waitForConnections: true,
  connectionLimit: 5,
});

// ✅ Проверка состояния API и базы
app.get('/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ ok: true, db: rows[0].ok === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ✅ Главный маршрут
app.get('/', (req, res) => {
  res.json({ name: 'Syntra API', version: '0.1.0' });
});

// ✅ Запуск сервера
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
