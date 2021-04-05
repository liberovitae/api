import mongoose from 'mongoose';
import moment from 'moment';
import { ApolloError } from 'apollo-server';
import bcrypt from 'bcrypt';
import validator from 'validator';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      validate: [
        validator.isEmail,
        'No valid email address provided.',
      ],
    },
    secondaryEmail: {
      // For email change verification
      type: String,
      validate: [
        validator.isEmail,
        'No valid email address provided.',
      ],
    },
    password: {
      type: String,
      required: true,
      validate(value) {
        try {
          if (!validator.isStrongPassword(value)) {
            throw new ApolloError('Password isnt strong enough');
          }
        } catch (err) {
          console.log(err);
        }
      },
    },
    saved: [
      {
        _id: false,
        post: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Post',
        },
        reminder: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Reminder',
        },
        createdAt: {
          type: Date,
          default: new Date(),
        },
      },
    ],
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
      },
    ],
    alerts: [
      {
        _id: false,
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Alert',
      },
    ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
    role: {
      type: String,
      enum: ['USER', 'ADMIN'],
      default: 'USER',
    },
    verified: {
      type: Boolean,
      required: true,
      default: false,
    },
    verification_token: Object,
    sleepUntil: {
      // Sleeper for removal of unverified accounts
      type: Date,
      default: moment(new Date()).add(3, 'days').toDate(),
    },
    subscription: {
      endpoint: String,
      expirationTime: String,
      keys: {
        p256dh: String,
        auth: String,
      },
    },
    settings: {
      locale: {
        type: String,
        default: 'en',
      },
      timezone: String,
    },
    lastLogin: Date,
  },
  {
    timestamps: true,
  },
);

userSchema.statics.findByLogin = async function (login) {
  let user = await this.findOne({
    username: login,
  });

  if (!user) {
    user = await this.findOne({ email: login });
  }

  return user;
};

userSchema.pre('remove', function (next) {
  this.model('Post').deleteMany({ userId: this._id }, next);
  this.model('Task').deleteMany({ userId: this._id }, next);
  this.model('Alert').deleteMany({ userId: this._id }, next);
});

userSchema.pre('save', async function () {
  this.password = await this.generatePasswordHash();
});

userSchema.pre('update', async function () {
  this.password = await this.generatePasswordHash();
});

userSchema.methods.generatePasswordHash = async function (password) {
  const saltRounds = 10;
  return await bcrypt.hash(this.password || password, saltRounds);
};

userSchema.methods.validatePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

User.createIndexes();

export default User;
