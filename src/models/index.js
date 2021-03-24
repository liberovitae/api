import mongoose from 'mongoose';
import User from './user';
import Job from './job';
import Company from './company';
import File from './file';
import Task from './task';
import Alert from './alert';
import Blog from './blog';
import Venue from './venue';

mongoose.set(
  'debug',
  process.env.NODE_ENV === 'development' ? true : false,
);

const connectDb = () => {
  if (process.env.DATABASE_URL) {
    return mongoose.connect(process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
  }
};

const models = {
  User,
  Job,
  Company,
  File,
  Task,
  Alert,
  Blog,
  Venue,
};

export { connectDb };

export default models;
