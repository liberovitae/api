import models from '../models';
import { Feed } from 'feed';

const RSSFeed = async (req, res, next) => {
  console.log(req, res);
  const feed = new Feed({
    title: 'liberovitae.com RSS Feed',
    link: process.env.HOSTNAME,
    description: 'liberovitae.com latest 100 jobs',
  });

  return await models.Job.find({ status: 'published' })
    .sort({ publishedAt: -1 })
    .limit(100)
    .populate('company')
    .then((jobs) => {
      jobs.forEach((job) => {
        console.log(job);
        feed.addItem({
          title: job.title,
          content: `${job.title} @ ${job.company.name} - ${job.location.name}`,
          link: `${process.env.HOSTNAME}/job/${job.slug}`,
        });
      });
      return res.send(feed.rss2());
    });
};

export default RSSFeed;
