import models from '../../models';

const searchJobs = async ({
  keywordsQuery,
  typesQuery,
  regionsQuery,
  locationQuery,
  task,
}) => {
  return await models.Job.aggregate([
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
            ...locationQuery,
          },
          { status: 'published' },
          { publishedAt: { $gt: task.updatedAt } },
          // Only search/filter on published jobs
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
  ]);
};

export default searchJobs;
