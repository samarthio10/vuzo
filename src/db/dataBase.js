import mongoose from 'mongoose';
import { DB_NAME } from '../constant.js';

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URI}/${DB_NAME}`
    );
    console.log(
      `connection successfull to database !! DB_HOST:${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error('connection failed to database', error);
    process.exit(1);
  }
};

export default connectDB;
