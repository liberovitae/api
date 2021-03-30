import mongoose from 'mongoose';
import isEmail from 'validator/lib/isEmail';
import isUrl from 'validator/lib/isURL';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoosePaginate from 'mongoose-paginate-v2';
import beautifyUnique from 'mongoose-beautiful-unique-validation';
import { venueTypes } from '../constants/venueTypes';

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

const venueSchema = new mongoose.Schema(
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
    url: {
      type: String,
      trim: true,
      validate: [
        { validator: urlValidator, msg: 'Invalid URL/Email address' },
      ],
    },
    types: {
      type: [String],
      enum: venueTypes,
      required: true,
      index: true,
    },
    tags: {
      type: Array,
      required: true,
      validate: [tagLimit, '{PATH} exceeds the limit of 10'],
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
    image: String,
    children: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    ],
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

venueSchema.plugin(aggregatePaginate);
venueSchema.plugin(mongoosePaginate);
// Enable beautifying on this schema
venueSchema.plugin(beautifyUnique);

venueSchema.statics.search = async function (
  { keywords, location, types },
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
        image: 1,
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

venueSchema.pre('remove', function (next) {
  this.model('Event').deleteMany({ parent: this._id }, next);
});

venueSchema.index({
  title: 'text',
  tags: 'text',
  'location.name': 'text',
  'location.countryName': 'text',
  types: 'text',
  publishedAt: 1,
  status: 1,
});

const Venue = mongoose.model('Venue', venueSchema);

Venue.createIndexes({
  collation: {
    locale: 'en',
    strength: 2,
  },
});

export { venueSchema };

export default Venue;
