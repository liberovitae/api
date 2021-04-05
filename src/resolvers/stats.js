export default {
  Mutation: {
    updateStats: async (parent, args, context, info) => {
      try {
        const { eventType, slug } = args;
        const { models } = context;

        if (eventType === 'page') {
          const post = await models.Post.findOneAndUpdate(
            {
              slug: slug,
            },
            { $inc: { 'stats.views': 1 } },
          );

          if (post) return true;

          return false;
        }

        if (eventType === 'track') {
          const post = await models.Post.findOneAndUpdate(
            {
              slug: slug,
            },
            { $inc: { 'stats.visits': 1 } },
          );

          if (post) return true;

          return false;
        }
        return false;
      } catch (err) {
        console.log(err);
      }
    },
  },
};
