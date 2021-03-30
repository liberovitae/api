module.exports = {
  async up(db, client) {
    // TODO write your migration here.
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});

    await db
      .collection('events')
      .updateMany({}, { $rename: { logo: 'image' } });
    await db
      .collection('companies')
      .updateMany({}, { $rename: { logo: 'image' } });
    await db
      .collection('venues')
      .updateMany({}, { $rename: { logo: 'image' } });
  },

  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
    await db
      .collection('events')
      .updateMany({}, { $rename: { image: 'logo' } });
    await db
      .collection('companies')
      .updateMany({}, { $rename: { image: 'logo' } });
    await db
      .collection('venues')
      .updateMany({}, { $rename: { image: 'logo' } });
  },
};
