import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    alertType: {
      type: String,
      enum: ['job', 'venue'],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    keywords: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    types: {
      type: Array,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly'],
      default: 'weekly',
    },
    active: {
      type: Boolean,
      default: true,
    },
    email: {
      type: Boolean,
      default: true,
    },
    notification: {
      type: Boolean,
      default: false,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
  },
  {
    timestamps: true,
  },
);

alertSchema.pre('remove', function (next) {
  this.model('Task').deleteOne({ alert: this._id }, next);
});

const Alert = mongoose.model('Alert', alertSchema);

export { alertSchema };

export default Alert;
