import models from '../../models';

const searchVenues = async ({
  keywordsQuery,
  typesQuery,
  locationQuery,
  task,
}) => {
  return await models.Venue.aggregate([
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
          // Only search/filter on published items
        ],
      },
    },
  ]);
};

export default searchVenues;
