import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['reminder', 'alert'],
      required: true,
    },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' },
    alert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Alert',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sleepUntil: { type: Date },
    interval: String,
    autoRemove: Boolean,
  },
  {
    timestamps: true,
  },
);

const Task = mongoose.model('Task', taskSchema);

taskSchema.index(
  {
    sleepUntil: 1, // the `sleepUntil` field path, set by the sleepUntilFieldPath
  },
  {
    sparse: true,
  },
);

Task.createIndexes();

export default Task;
