import mongoose from 'mongoose';
import User from './user';
import Job from './job';
import Company from './company';
import File from './file';
import Task from './task';
import Alert from './alert';
import Blog from './blog';
import Venue from './venue';
import Event from './event';

mongoose.set(
  'debug',
  process.env.NODE_ENV === 'development' ? true : false,
);

const connectDb = () => {
  if (process.env.DATABASE_HOST) {
    return mongoose.connect(
      `${process.env.DATABASE_HOST}/${process.env.DATABASE_NAME}`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
      },
    );
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
  Event,
};

export { connectDb };

export default models;
