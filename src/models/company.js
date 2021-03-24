import mongoose from 'mongoose';
import beautifyUnique from 'mongoose-beautiful-unique-validation';

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: 'Company name must be unique',
    },
    website: String,
    logo: String,
    tagline: String,
    twitter: String,
    linkedin: String,
    jobs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
      },
    ],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    verified: Boolean,
  },
  {
    timestamps: true,
  },
);

const Company = mongoose.model('Company', companySchema);

companySchema.plugin(beautifyUnique);

companySchema.index({
  name: 'text',
});

Company.createIndexes();

companySchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('There was a duplicate key error'));
  } else {
    next(error);
  }
});

export default Company;
