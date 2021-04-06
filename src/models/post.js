import mongoose from 'mongoose';
import isEmail from 'validator/lib/isEmail';
import isUrl from 'validator/lib/isURL';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoosePaginate from 'mongoose-paginate-v2';
import beautifyUnique from 'mongoose-beautiful-unique-validation';

const tagLimit = (val) => {
  return val.length <= 10;
};

const urlValidator = (value) => {
  if (!value) return true;
  if (isEmail(value) || isUrl(value)) {
    return true;
  }
  return false;
};

const postSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      index: true,
      enum: ['job', 'venue', 'event', 'company', 'blog'],
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
      },
    ],
    title: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    dates: {
      start: { type: Date, default: null },
      end: { type: Date, default: null },
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      name: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },
      countryName: { type: String, trim: true, index: true },
      lat: Number,
      lon: Number,
    },

    url: {
      type: String,
      trim: true,
      validate: [
        { validator: urlValidator, msg: 'Invalid URL/Email address' },
      ],
    },
    types: [
      {
        type: String,
        required: true,
        index: true,
      },
    ],

    tags: {
      type: [
        {
          type: String,
          required: true,
        },
      ],
      validate: [tagLimit, '{PATH} exceeds the limit of 10'],
    },

    status: {
      type: String,
      enum: ['draft', 'published', 'inactive', 'filled'],
      default: 'draft',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    featured: Boolean,
    image: String,
    publishedAt: { type: Date },
    stats: {
      views: { type: Number, default: 0 },
      visits: { type: Number, default: 0 },
      saves: { type: Number, default: 0 },
    },
    commentsEnabled: { type: Boolean, default: false },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
    commentCount: { type: Number, default: 0 },
    sleepUntil: {
      // Sleeper for inactivity and auto removal
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

postSchema.pre('remove', function (next) {
  this.model('Post').findOneAndUpdate(
    { parent: this.parent },
    { $pull: { children: this._id } },
    next,
  );
});

postSchema.plugin(aggregatePaginate);
postSchema.plugin(mongoosePaginate);
// Enable beautifying on this schema
postSchema.plugin(beautifyUnique);

postSchema.statics.search = async function (
  { keywords, location, types, dates, publishedAt },
  type,
  limit,
  cursor,
) {
  const options = {
    page: cursor || 1,
    limit: limit,
    allowDiskUse: true,
  };

  let keywordsQuery;
  let typesQuery;
  let datesQuery;
  let publishedAtQuery;

  keywords.length
    ? (keywordsQuery = {
        $or: [
          {
            $text: { $search: `"${keywords}"` },
          },
        ],
      })
    : null;

  types.length
    ? (typesQuery = {
        types: {
          $not: {
            $elemMatch: {
              $nin: types,
            },
          },
        },
      })
    : null;

  publishedAt
    ? (publishedAtQuery = { publishedAt: { $gt: task.updatedAt } })
    : null;

  const dateRangeQuery =
    dates?.start && dates?.end
      ? {
          'dates.start': {
            $gte: new Date(new Date(dates.start).setHours(0, 0, 0)),
          },

          'dates.end': {
            $lte: new Date(new Date(dates.end).setHours(23, 59, 59)),
          },
        }
      : null;

  const sameDateQuery = {
    $or: [
      {
        $and: [
          {
            'dates.start': {
              $lte: new Date(
                new Date(dates?.start).setHours(23, 59, 59),
              ),
            },
            'dates.end': {
              $gte: new Date(new Date(dates?.end).setHours(0, 0, 0)),
            },
          },
        ],
      },
      {
        $and: [
          {
            'dates.start': {
              $eq: new Date(new Date(dates?.start).setHours(0, 0, 0)),
            },
            'dates.end': {
              $eq: new Date(
                new Date(dates?.end).setHours(23, 59, 59),
              ),
            },
          },
        ],
      },
    ],
  };

  const buildDateQuery =
    JSON.stringify(dates?.start) === JSON.stringify(dates?.end)
      ? sameDateQuery
      : dateRangeQuery;

  dates?.start && dates?.end
    ? (datesQuery = {
        ...buildDateQuery,
      })
    : null;

  const searchAggregate = this.aggregate([
    {
      $match: {
        $and: [
          { type: type },
          { ...keywordsQuery },
          {
            $and: [
              {
                ...typesQuery,
              },
            ],
          },
          { ...datesQuery },
          {
            'location.name': {
              $regex: location.name,
              $options: 'i',
            },
          },
          { status: 'published' },
          { ...publishedAtQuery },
        ],
      },
    },

    {
      $lookup: {
        from: 'posts',
        localField: 'parent',
        foreignField: '_id',
        as: 'parent',
      },
    },

    {
      $unwind: { path: '$parent', preserveNullAndEmptyArrays: true },
    },

    { $sort: { featured: -1, publishedAt: -1 } },
    {
      $project: {
        id: 1,
        title: 1,
        type: 1,
        'parent.title': 1,
        image: 1,
        slug: 1,
        dates: 1,
        tags: 1,
        commentCount: 1,
        commentsEnabled: 1,
        types: 1,
        location: 1,
        status: 1,
        publishedAt: 1,
        featured: 1,
      },
    },
  ]).collation({ locale: 'en', strength: 2 });

  return await this.aggregatePaginate(searchAggregate, options);
};

postSchema.index({
  title: 'text',
  tags: 'text',
  'location.name': 'text',
  'location.countryName': 'text',
  types: 'text',
  publishedAt: 1,
  status: 1,
});

const Post = mongoose.model('Post', postSchema);

Post.createIndexes({
  collation: {
    locale: 'en',
    strength: 2,
  },
});

export { postSchema };

export default Post;
