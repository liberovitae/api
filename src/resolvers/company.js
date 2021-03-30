import { combineResolvers } from 'graphql-resolvers';
import { ApolloError } from 'apollo-server';
import { isAuthenticated, isCompanyOwner } from './authorization';

export default {
  Query: {
    company: async (parent, { id }, { models }) => {
      try {
        return await models.Company.findById(id);
      } catch (err) {
        console.log(err);
      }
    },
  },

  Mutation: {
    createCompany: combineResolvers(
      isAuthenticated,
      async (
        parent,
        { title, image, website, tagline, twitter, linkedin },
        { models, me },
      ) => {
        try {
          const company = await models.Company.create({
            title,
            image,
            website,
            tagline,
            twitter,
            linkedin,
            userId: me.id,
          });

          await models.User.findByIdAndUpdate(me.id, {
            company: company.id,
          });

          return company;
        } catch (err) {
          console.log(err);

          if (err.code === 11000) {
            throw new ApolloError(
              'Company already exists or you have a company already',
            );
          }
        }
      },
    ),

    deleteCompany: combineResolvers(
      isAuthenticated,
      isCompanyOwner,
      async (parent, { id }, { models }) => {
        try {
          const company = await models.Company.findById(id);

          if (company) {
            await company.remove();
            return true;
          } else {
            return false;
          }
        } catch (err) {
          console.log(err);
        }
      },
    ),

    updateCompany: combineResolvers(
      isAuthenticated,
      isCompanyOwner,
      async (
        parent,
        { id, title, image, website, tagline, twitter, linkedin },
        { models },
      ) => {
        try {
          const company = await models.Company.findByIdAndUpdate(id, {
            title: title,
            image: image,
            website: website,
            tagline: tagline,
            twitter: twitter,
            linkedin: linkedin,
          });

          if (company.title !== title) {
            await models.Job.updateMany(
              { parentName: company.title },
              { parentName: title },
            );
          }

          if (company) {
            return company;
          } else {
            return false;
          }
        } catch (err) {
          console.log(err);
        }
      },
    ),
  },

  Company: {
    id: (parent, args, { models }) => parent._id,
  },
};
