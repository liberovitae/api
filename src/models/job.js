import mongoose from 'mongoose';
import isEmail from 'validator/lib/isEmail';
import isUrl from 'validator/lib/isURL';
import moment from 'moment';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoosePaginate from 'mongoose-paginate-v2';
import beautifyUnique from 'mongoose-beautiful-unique-validation';
import { jobTypes } from '../constants/jobTypes';
import regions from '../constants/regions';

function tagLimit(val) {
  return val.length <= 10;
}

const urlValidator = (value) => {
  if (isEmail(value) || isUrl(value)) {
    return true;
  }
  return false;
};

const jobSchema = new mongoose.Schema(
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
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      name: String,
    },
    companyName: { type: String, required: true }, // Keep this for text search on company name as well (mongoDB limitation)
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
      required: true,
      trim: true,
      validate: [
        { validator: urlValidator, msg: 'Invalid URL/Email address' },
      ],
    },
    types: {
      type: [String],
      enum: jobTypes,
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
      enum: ['draft', 'published', 'inactive', 'filled'],
      default: 'draft',
    },
    featured: Boolean,
    publishedAt: { type: Date },
    sleepUntil: {
      // Sleeper for job inactivity and auto removal
      type: Date,
      default: moment(new Date()).add(2, 'months').toDate(),
    },
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

jobSchema.pre('remove', function (next) {
  this.model('Company').findOneAndUpdate(
    { userId: this.userId },
    { $pull: { jobs: { $in: this._id } } },
    next,
  );
});

jobSchema.plugin(aggregatePaginate);
jobSchema.plugin(mongoosePaginate);
// Enable beautifying on this schema
jobSchema.plugin(beautifyUnique);

jobSchema.statics.search = async function (
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

    {
      $lookup: {
        from: 'companies',
        localField: 'company',
        foreignField: '_id',
        as: 'company',
      },
    },

    { $unwind: '$company' },

    { $sort: { featured: -1, publishedAt: -1 } },
    {
      $project: {
        id: 1,
        title: 1,
        company: 1,
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

jobSchema.index({
  companyName: 'text',
  title: 'text',
  tags: 'text',
  'location.name': 'text',
  'location.countryName': 'text',
  regions: 'text',
  types: 'text',
  publishedAt: 1,
  status: 1,
});

const Job = mongoose.model('Job', jobSchema);

Job.createIndexes({
  collation: {
    locale: 'en',
    strength: 2,
  },
});

export { jobSchema };

export default Job;
