import models from '../models';
import { Feed } from 'feed';

const RSSFeed = async (req, res, next) => {
  console.log(req, res);
  const feed = new Feed({
    title: `${process.env.SITE_NAME} RSS Feed`,
    link: process.env.HOSTNAME,
    description: `${process.env.SITE_NAME} latest 100 posts`,
  });

  return await models.Post.find({ status: 'published' })
    .sort({ publishedAt: -1 })
    .limit(100)
    .populate('parent')
    .then((posts) => {
      posts.forEach((post) => {
        feed.addItem({
          title: post.title,
          content: `${post.title} @ ${post.parent.title} - ${post.location.name}`,
          link: `${process.env.HOSTNAME}/${post.type}/${post.slug}`,
        });
      });
      return res.send(feed.rss2());
    });
};

export default RSSFeed;
