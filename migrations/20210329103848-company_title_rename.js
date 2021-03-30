module.exports = {
  async up(db, client) {
    // TODO write your migration here.
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});
    await db.collection('events').dropIndexes();
    await db.collection('companies').dropIndexes();
    await db.collection('venues').dropIndexes();
    await db.collection('jobs').dropIndexes();
    await db
      .collection('companies')
      .updateMany({}, { $rename: { name: 'title' } });
  },

  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
    await db
      .collection('companies')
      .updateMany({}, { $rename: { title: 'name' } });
  },
};
