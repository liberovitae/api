import cities from 'all-the-cities';
import { combineResolvers } from 'graphql-resolvers';
import { getGraphQLRateLimiter } from 'graphql-rate-limit';

const rateLimiter = getGraphQLRateLimiter({
  identifyContext: (ctx) => ctx.id,
});

export default {
  Query: {
    location: async (parent, { location }, { models }) => {
      try {
        const cityTag = location.split(',')[0];
        // const country = location.split(',').pop();
        const foundCities = cities.filter((city) =>
          city.name.match(new RegExp(cityTag, 'i')),
        );
        return foundCities;
      } catch (err) {
        console.log(err);
        throw new ApolloError(err);
      }
    },
  },
};
