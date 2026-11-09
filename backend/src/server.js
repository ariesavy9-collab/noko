require('dotenv').config();
const cors = require('cors');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const postRoutes = require('./routes/postRoutes');

const app = express();
const port = Number(process.env.PORT) || 5000;

if (!process.env.MONGODB_URI || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('Configure MONGODB_URI and a JWT_SECRET of at least 32 characters in backend/.env.');
}

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000' }));
app.use(express.json({ limit: '100kb' }));
app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'degraded',
    database: connected ? 'connected' : 'unavailable',
    ...(!connected && { message: 'Database unavailable. Check the MongoDB Atlas hostname and network connection.' })
  });
});
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'Database unavailable. Check the MongoDB Atlas hostname and network connection.'
    });
  }
  next();
});
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }), authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/posts', postRoutes);

app.use((req, res) => res.status(404).json({ message: 'Endpoint not found.' }));
app.use((error, req, res, next) => {
  console.error(error);
  if (error.code === 11000) return res.status(409).json({ message: 'That account already exists.' });
  if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
  if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid identifier.' });
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

app.listen(port, () => console.log(`Noko Mashaba API listening on http://localhost:${port}`));

mongoose.connect(process.env.MONGODB_URI).catch((error) => {
  console.error('Unable to connect to MongoDB:', error.message);
});
