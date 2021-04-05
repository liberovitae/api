export const batchJobs = async (keys, models) => {
  const posts = await models.Post.find({
    _id: {
      $in: keys,
    },
    status: 'published',
  }).sort({ publishedAt: -1 });

  return keys.map((key) => posts.find((post) => post.id == key));
};
