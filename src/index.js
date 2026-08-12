import dotenv from 'dotenv';
import connectDB from './db/dataBase.js';

dotenv.config({
  path: './src/.env',
});

const Port = process.env.PORT;

connectDB()
  .then(() => {
    app.listen('listening on ${Port}');
  })
  .catch((err) => {
    console.error('MONGODB connection error', error);
  });
