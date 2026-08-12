import dotenv from 'dotenv';
import connectDB from './db/dataBase.js';

dotenv.config({
  path: './src/.env',
});

connectDB();
