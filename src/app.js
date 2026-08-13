import express, { urlencoded } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRouter from './routes/user.route.js';
import healthRouter from './routes/healthCheck.routes.js';

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:8000',
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.json({ limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());

app.use('/api/v1/user', userRouter);
app.use('/api/v1/health', healthRouter);

export default app;
