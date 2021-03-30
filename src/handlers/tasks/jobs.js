import models from '../../models';

const searchJobs = async ({
  keywordsQuery,
  typesQuery,
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
        localField: 'parent',
        foreignField: '_id',
        as: 'parent',
      },
    },
    { $unwind: '$parent' },
  ]);
};

export default searchJobs;
