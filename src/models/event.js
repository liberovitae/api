import mongoose from 'mongoose';
import isEmail from 'validator/lib/isEmail';
import isUrl from 'validator/lib/isURL';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoosePaginate from 'mongoose-paginate-v2';
import beautifyUnique from 'mongoose-beautiful-unique-validation';
import { eventTypes } from '../constants/eventTypes';
import regions from '../constants/regions';

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
    regions: {
      type: [String],
      enum: regions,
      required: true,
      index: true,
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
    venueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'inactive'],
      default: 'draft',
    },
    featured: Boolean,
    logo: String,
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
  { keywords, location, regions, types },
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
  let regionsQuery;

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

  regions.length
    ? (regionsQuery = {
        regions: {
          $not: {
            $elemMatch: {
              $nin: regions,
            },
          },
        },
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
              {
                ...regionsQuery,
              },
            ],
          },
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

    { $sort: { featured: -1, publishedAt: -1 } },
    {
      $project: {
        id: 1,
        title: 1,
        logo: 1,
        slug: 1,
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
  regions: 'text',
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
