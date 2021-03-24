export const batchJobs = async (keys, models) => {
  const jobs = await models.Job.find({
    _id: {
      $in: keys,
    },
    status: 'published',
  }).sort({ publishedAt: -1 });

  return keys.map((key) => jobs.find((job) => job.id == key));
};
