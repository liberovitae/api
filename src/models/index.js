import mongoose from 'mongoose';
import User from './user';
import File from './file';
import Task from './task';
import Alert from './alert';
import Post from './post';
import Comment from './comment';

mongoose.set(
  'debug',
  process.env.NODE_ENV === 'development' && !process.env.FAKE_DATA
    ? true
    : false,
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
  File,
  Task,
  Alert,
  Post,
  Comment,
};

export { connectDb };

export default models;
