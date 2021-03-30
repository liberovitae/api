module.exports = {
  async up(db, client) {
    // TODO write your migration here.
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});
    await db
      .collection('jobs')
      .updateMany({}, { $rename: { company: 'parent' } });
    await db
      .collection('jobs')
      .updateMany({}, { $rename: { companyName: 'parentName' } });
    await db
      .collection('events')
      .updateMany({}, { $rename: { venue: 'parent' } });
  },

  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
    await db
      .collection('jobs')
      .updateMany({}, { $rename: { parent: 'company' } });
    await db
      .collection('jobs')
      .updateMany({}, { $rename: { parentName: 'companyName' } });
    await db
      .collection('events')
      .updateMany({}, { $rename: { parent: 'venue' } });
  },
};
