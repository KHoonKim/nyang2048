import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB } from './db/init.js';
import authRoutes from './routes/auth.js';
import coinRoutes from './routes/coins.js';
import exchangeRoutes from './routes/exchange.js';
import promoRoutes from './routes/promo.js';
import attendanceRoutes from './routes/attendance.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4006;

app.use(cors());
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/appintos/nyang2048', express.static(path.join(__dirname, 'public')));

const db = initDB();
const prefix = '/api/nyang2048';
app.use(prefix, authRoutes(db));
app.use(prefix, coinRoutes(db));
app.use(prefix, exchangeRoutes(db));
app.use(prefix, promoRoutes(db));
app.use(prefix, attendanceRoutes(db));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'nyang2048' }));
app.get('/api/nyang2048/health', (_req, res) => res.json({ ok: true, service: 'nyang2048' }));

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[nyang2048] 서버 시작: http://localhost:${PORT}`);
});
