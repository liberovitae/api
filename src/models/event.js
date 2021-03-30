import mongoose from 'mongoose';
import isEmail from 'validator/lib/isEmail';
import isUrl from 'validator/lib/isURL';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoosePaginate from 'mongoose-paginate-v2';
import beautifyUnique from 'mongoose-beautiful-unique-validation';
import { eventTypes } from '../constants/eventTypes';

function tagLimit(val) {
  return val.length <= 10;
}

const urlValidator = (value) => {
  if (!value) return true;
  if (isEmail(value) || isUrl(value)) {
    return true;
  }
  return false;
};

const eventSchema = new mongoose.Schema(
  {
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      required: true,
    },
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
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    description: {
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
    types: {
      type: [String],
      enum: eventTypes,
      required: true,
      index: true,
    },
    tags: {
      type: Array,
      required: true,
      validate: [tagLimit, '{PATH} exceeds the limit of 10'],
    },

    status: {
      type: String,
      enum: ['draft', 'published', 'inactive'],
      default: 'draft',
    },
    featured: Boolean,
    image: String,
    publishedAt: { type: Date },
    stats: {
      views: { type: Number, default: 0 },
      visits: { type: Number, default: 0 },
      saves: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  },
);

eventSchema.plugin(aggregatePaginate);
eventSchema.plugin(mongoosePaginate);
// Enable beautifying on this schema
eventSchema.plugin(beautifyUnique);

eventSchema.statics.search = async function (
  { keywords, location, types, dates },
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

  dates?.start && dates?.end
    ? (datesQuery = {
        $or: [
          {
            'dates.start': {
              $gte: new Date(
                new Date(dates?.start).setHours(0, 0, 0),
              ),
            },
            'dates.start': {
              $lte: new Date(
                new Date(dates?.end).setHours(23, 59, 59),
              ),
            },
            'dates.end': {
              $lte: new Date(
                new Date(dates?.end).setHours(23, 59, 59),
              ),
            },
          },
        ],
      })
    : null;

  const searchAggregate = this.aggregate([
    {
      $match: {
        $and: [
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
        ],
      },
    },

    {
      $lookup: {
        from: 'venues',
        localField: 'parent',
        foreignField: '_id',
        as: 'parent',
      },
    },

    { $unwind: '$parent' },

    { $sort: { featured: -1, publishedAt: -1 } },
    {
      $project: {
        id: 1,
        title: 1,
        'parent.title': 1,
        image: 1,
        slug: 1,
        dates: 1,
        tags: 1,
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

eventSchema.index({
  title: 'text',
  tags: 'text',
  'location.name': 'text',
  'location.countryName': 'text',
  types: 'text',
  publishedAt: 1,
  status: 1,
});

const Event = mongoose.model('Event', eventSchema);

Event.createIndexes({
  collation: {
    locale: 'en',
    strength: 2,
  },
});

export { eventSchema };

export default Event;
