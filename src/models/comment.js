import mongoose from 'mongoose';
import generateSlug from '../handlers/generateSlug';
import moment from 'moment';
import voting from 'mongoose-voting';
import mongoose_delete from 'mongoose-delete';
import tagsPlugin from 'mongoose-plugin-tags';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoosePaginate from 'mongoose-paginate-v2';

const commentSchema = mongoose.Schema(
  {
    text: { type: String, required: true, tags: true, trim: true },
    image: String,
    author: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      username: { type: String, required: true },
    },
    slug: { type: String, index: true, unique: true },
    fullSlug: String,
    parentSlug: String,
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },
    permalink: String,
    postId: {
      kind: String,
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'postId.kind',
      required: true,
    },
    depth: {
      type: Number,
      default: 0,
    },
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],

    reports: Array,
    points: { type: Number, default: 0 },
    score: { type: Number },
  },

  { timestamps: true },
);

const autoPopulateChildren = function (next) {
  console.log('Autopopulating..');
  this.populate({
    path: 'children',
    options: { sort: { createdAt: -1 } },
  });
  next();
};

commentSchema
  .pre('findOne', autoPopulateChildren)
  .pre('find', autoPopulateChildren);

// Default voter is `User` model
commentSchema.plugin(voting);
commentSchema.plugin(mongoose_delete, {
  deletedAt: true,
  deletedBy: true,
});
commentSchema.plugin(aggregatePaginate);
commentSchema.plugin(mongoosePaginate);

commentSchema.plugin(tagsPlugin);

commentSchema.pre('save', function (next) {
  let comment = this;
  let timestamp = moment(comment.createdAt).format(
    'YYYY.MM.DD.hh:mm:ss',
  );
  const slugPart = generateSlug();
  const fullSlugPart = timestamp + ':' + slugPart;
  if (comment.parentId) {
    Comment.findOne(
      {
        _id: comment.parentId,
      },
      {
        depth: 1,
        slug: 1,
        fullSlug: 1,
        parentSlug: 1,
      },
    ).then((parent) => {
      comment.depth = parent.depth + 1;
      comment.parentSlug = parent.slug;
      comment.slug = parent.slug + '/' + slugPart;
      comment.fullSlug = parent.fullSlug + '/' + fullSlugPart;
      comment.updatedAt = null;
      next();
    });
  } else {
    comment.slug = slugPart;
    comment.fullSlug = timestamp + ':' + slugPart;
    // Reset updatedAt
    comment.updatedAt = null;

    next();
  }
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = mongoose.model('Comment', commentSchema);
