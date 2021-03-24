export default {
  Mutation: {
    updateStats: async (parent, args, context, info) => {
      try {
        const { eventType, itemType, slug } = args;
        const { models } = context;

        if (itemType === 'job') {
          if (eventType === 'page') {
            const job = await models.Job.findOneAndUpdate(
              {
                slug: slug,
              },
              { $inc: { 'stats.views': 1 } },
            );

            if (job) return true;

            return false;
          }

          if (eventType === 'track') {
            const job = await models.Job.findOneAndUpdate(
              {
                slug: slug,
              },
              { $inc: { 'stats.visits': 1 } },
            );

            if (job) return true;

            return false;
          }
        }

        if (itemType === 'venue') {
          if (eventType === 'page') {
            const venue = await models.Venue.findOneAndUpdate(
              {
                slug: slug,
              },
              { $inc: { 'stats.views': 1 } },
            );

            if (venue) return true;

            return false;
          }

          if (eventType === 'track') {
            const venue = await models.Venue.findOneAndUpdate(
              {
                slug: slug,
              },
              { $inc: { 'stats.visits': 1 } },
            );

            if (venue) return true;

            return false;
          }
        }
      } catch (err) {
        console.log(err);
      }
    },
  },
};
