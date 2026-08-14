import dotenv from 'dotenv';

dotenv.config({
  path: './src/.env',
});

import connectDB from './db/dataBase.js';
import app from './app.js';

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`listening on ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MONGODB connection error', err);
    process.exit(1);
  });
