export const batchCompanies = async (keys, models) => {
  const companies = await models.Company.find({
    _id: {
      $in: keys,
    },
  });

  return keys.map((key) =>
    companies.find((company) => company.id == key),
  );
};
