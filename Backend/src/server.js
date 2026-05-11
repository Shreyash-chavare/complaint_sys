import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import dotenv from 'dotenv';
// dotenv.config();
dotenv.config({ path: "../.env" });

import connectDB from './utils/db.js';

const app = express();
const PORT = process.env.PORT || 5005;
connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
