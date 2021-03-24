'use strict';

import { config } from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import http from 'http';
import jwt from 'jsonwebtoken';
import path from 'path';
import DataLoader from 'dataloader';
import express from 'express';
import {
  ApolloServer,
  AuthenticationError,
  GraphQLExtension,
} from 'apollo-server-express';
import { graphqlUploadExpress } from 'graphql-upload';
import responseCachePlugin from 'apollo-server-plugin-response-cache';
import { RedisCache } from 'apollo-server-redis';
import { deflate } from 'graphql-deduplicator';
import schema from './schema';
import resolvers from './resolvers';
import models, { connectDb } from './models';
import loaders from './loaders';
import shrinkRay from 'shrink-ray-current';
import { MongoCron } from 'mongodb-cron';
import { TaskHandler } from './handlers/tasks';
import RSSFeed from './handlers/feed';
import createFakeData from './handlers/faker';

const env = process.env.NODE_ENV;
const app = express();
const dir = path.join(process.cwd(), 'images');

config({ path: `./.env.${env}` });

process.on('unhandledRejection', (error, promise) => {
  console.log(
    ' Oh Lord! We forgot to handle a promise rejection here: ',
    promise,
  );
  console.log(' The error was: ', error);
});

if (process.env.FAKE_DATA) {
  try {
    createFakeData().then(() => process.exit());
  } catch (err) {
    console.error(err);
  }
}

if (process.env.GENERATE_VAPID) {
  try {
    const vapidKeys = webpush.generateVAPIDKeys();
    console.log(vapidKeys.publicKey, vapidKeys.privateKey);
    process.exit();
  } catch (err) {
    console.error(err);
  }
}

app.use(shrinkRay());
app.use(cors());
app.use(express.static(dir));
app.use('/images', express.static(dir));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(morgan('dev'));

app.use(
  '/graphql',
  express.json(),
  graphqlUploadExpress({
    maxFileSize: 10000000,
    maxFiles: 10,
    formatResponse: (response) => {
      if (response.data && !response.data.__schema) {
        return deflate(response);
      }

      return response;
    },
  }),
);

app.use('/feed', (req, res) => RSSFeed(req, res));

const getMe = async (req) => {
  const token = req.headers['x-token'];

  if (token) {
    try {
      return jwt.verify(token, process.env.SECRET);
    } catch (e) {
      throw new AuthenticationError(
        'Your session expired. Sign in again.',
        1000,
      );
    }
  }
};

class DeduplicateResponseExtension extends GraphQLExtension {
  willSendResponse(o) {
    const { context, graphqlResponse } = o;
    // Ensures `?deduplicate=1` is used in the request
    if (
      context.req.query.deduplicate &&
      graphqlResponse.data &&
      !graphqlResponse.data.__schema
    ) {
      const data = deflate(graphqlResponse.data);
      return {
        ...o,
        graphqlResponse: {
          ...graphqlResponse,
          data,
        },
      };
    }

    return o;
  }
}

const server = new ApolloServer({
  uploads: false,
  introspection:
    process.env.NODE_ENV === 'development' ? true : false,
  typeDefs: schema,
  resolvers,
  cacheControl: {
    defaultMaxAge: 0,
  },
  plugins: [
    responseCachePlugin(),
    new DeduplicateResponseExtension(),
  ],
  cache: new RedisCache({
    connectTimeout: 5000,
    reconnectOnError: function (err) {
      Logger.error('Reconnect on error', err);
      const targetError = 'READONLY';
      if (err.message.slice(0, targetError.length) === targetError) {
        // Only reconnect when the error starts with "READONLY"
        return true;
      }
    },
    retryStrategy: function (times) {
      Logger.error('Redis Retry', times);
      if (times >= 3) {
        return undefined;
      }
      return Math.min(times * 50, 2000);
    },
    socket_keepalive: false,
    host: 'localhost',
    port: 6379,
  }),

  formatError: (error) => {
    // remove the internal sequelize error message
    // leave only the important validation error
    const message = error.message
      .replace('SequelizeValidationError: ', '')
      .replace('Validation error: ', '');

    return {
      ...error,
      message,
    };
  },
  context: async ({ req, connection }) => {
    if (connection) {
      return {
        models,
        loaders: {
          job: new DataLoader((keys) =>
            loaders.job.batchJobs(keys, models),
          ),
          company: new DataLoader((keys) =>
            loaders.company.batchCompanies(keys, models),
          ),
        },
      };
    }

    if (req) {
      const me = await getMe(req);

      return {
        models,
        me,
        secret: process.env.SECRET,
        loaders: {
          user: new DataLoader((keys) =>
            loaders.user.batchUsers(keys, models),
          ),
          // company: new DataLoader((keys) =>
          //   loaders.company.batchCompanies(keys, models),
          // ),
        },
      };
    }
  },
});

server.applyMiddleware({ app, path: '/graphql' });

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

const port = process.env.PORT || 8000;

connectDb().then(async (data) => {
  const taskCron = new MongoCron({
    collection: data.connection.db.collection('tasks'),
    onDocument: async (task) => {
      TaskHandler({ input: task });
    }, // triggered on job processing/
    onError: async (err) => console.log(err),
    onStart: () => console.log('Tasks cron started ...'),
    onStop: () => console.log('Tasks cron stopped'),
    nextDelay: 1000,
    reprocessDelay: 1000,
    idleDelay: 10000,
    lockDuration: 600000,
  });

  const userCron = new MongoCron({
    collection: data.connection.db.collection('users'),
    onDocument: async (user) => {
      console.log('Running user clean');
      if (user.verified) {
        console.log('User verified');
        return true;
      } else {
        console.log('Removing user');
        console.log(user);
        return await models.User.findByIdAndDelete(user._id);
      }
    }, // triggered on job processing/
    onError: async (err) => console.log(err),
    onStart: () => console.log('Users cron started ...'),
    onStop: () => console.log('Users cron stopped'),
    nextDelay: 1000,
    reprocessDelay: 1000,
    idleDelay: 10000,
    lockDuration: 600000,
  });

  const jobsCron = new MongoCron({
    collection: data.connection.db.collection('jobs'),
    onDocument: async (job) => {
      models.Jobs.findByIdAndUpdate(job._id, {
        status: 'inactive',
      });
    }, // triggered on job processing/
    onError: async (err) => console.log(err),
    onStart: () => console.log('Jobs cron started ...'),
    onStop: () => console.log('Jobs cron stopped'),
    nextDelay: 1000,
    reprocessDelay: 1000,
    idleDelay: 10000,
    lockDuration: 600000,
  });

  taskCron.start(); // start processing
  userCron.start();
  jobsCron.start();

  httpServer.listen({ port }, () => {
    console.log(`Apollo Server on http://localhost:${port}/graphql`);
  });
});
