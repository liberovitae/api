import mongoose from 'mongoose';
import beautifyUnique from 'mongoose-beautiful-unique-validation';

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
    },
    text: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    publishedAt: { type: Date },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    views: Number,
  },
  {
    timestamps: true,
  },
);

const Blog = mongoose.model('Blog', blogSchema);

blogSchema.plugin(beautifyUnique);

blogSchema.index({
  title: 'text',
});

Blog.createIndexes();

blogSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('There was a duplicate key error'));
  } else {
    next(error);
  }
});

export default Blog;
