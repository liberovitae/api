import models from '../models';
import jobTypes from '../constants/jobTypes';
import venueTypes from '../constants/venueTypes';
import eventTypes from '../constants/eventTypes';
import cities from 'all-the-cities';
import faker from 'faker';
import generateSlug from './generateSlug';
import ora from 'ora';

const dataTypes = [
  {
    title: () => faker.name.jobTitle(),
    image: () => faker.image.business(200, 200, true),
    hasComments: false,
    hasDates: false,
    hasLocation: true,
    type: 'job',
    requiresParent: true,
    parentType: 'company',
    types: jobTypes,
  },
  {
    title: () => `${faker.company.companyName()}`,
    image: () => faker.image.business(200, 200, true),
    hasComments: false,
    hasDates: false,
    hasLocation: true,
    type: 'company',
    requiresParent: false,
    types: venueTypes,
  },
  {
    title: () =>
      `${faker.address.city()} ${faker.commerce.product()}`,
    image: () => faker.image.nightlife(200, 200, true),
    hasComments: true,
    hasDates: false,
    hasLocation: true,
    type: 'venue',
    requiresParent: false,
    types: venueTypes,
  },
  {
    title: () =>
      `${faker.address.city()} ${faker.commerce.department()} ${
        Math.random() < 0.5 ? faker.date.weekday() : ''
      }`,
    image: () => faker.image.nightlife(200, 200, true),

    hasComments: true,
    hasDates: true,
    hasLocation: true,
    type: 'event',
    requiresParent: true,
    parentType: 'venue',
    types: eventTypes,
  },
];

const createFakeUser = async () => {
  try {
    const fakeUser = {
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password: faker.internet.password(
        9,
        false,
        /^[a-zA-Z0-9!@#$&()\\-`.+,/\"]*$/,
      ),
      verified: true, // Verify our fake user otherwise the autodeletion runs
    };

    const user = await models.User.create(fakeUser);

    if (user) {
      return user;
    } else {
      return false;
    }
  } catch (err) {
    console.log(err);
  }
};

const createFakePost = async ({ parent, dataType, userId }) => {
  try {
    const { title, type, hasDates, hasComments, image } = dataType;

    // Generate fake tags
    let tags = [];

    for (let i = 0; i < Math.floor(Math.random() * 10 + 1); i++) {
      tags.push(faker.random.word());
    }

    // Generate fake location
    const fakeCity =
      cities[Math.floor(Math.random() * cities.length)];

    let location;

    if (fakeCity.country === 'US') {
      location = {
        name: `${fakeCity.name}, ${fakeCity.adminCode}, ${fakeCity.country}`,
        lat: fakeCity.lat,
        lon: fakeCity.lon,
      };
    } else {
      location = {
        name: `${fakeCity.name}, ${fakeCity.country}`,
        lat: fakeCity.lat,
        lon: fakeCity.lon,
      };
    }

    let startDate;
    let endDate;

    // Generate fake (start) date
    hasDates
      ? ((startDate = faker.date.recent()),
        (endDate = faker.date.soon(3, startDate)))
      : null;

    const postTitle = title();

    const fakePost = {
      title: postTitle,
      type,
      location,
      text: `<h1>${faker.lorem.words(6)}</h1>
      <p>
      ${faker.lorem.paragraphs(5)}
      </p>
      <ul>
      <li>${faker.lorem.words(5)}</li>
      <li>${faker.lorem.words(3)}</li>
      <li>${faker.lorem.words(6)}</li>
      <li>${faker.lorem.words(8)}</li>
      </ul>
      <p>
      ${faker.lorem.paragraphs(8)}
      </p>
      <p>Contact: ${faker.internet.email()} or ${faker.phone.phoneNumber()}
      `,
      types:
        dataType.types[
          Math.floor(Math.random() * dataType.types.length)
        ],
      url:
        Math.random() < 0.5
          ? faker.internet.url()
          : faker.internet.email(),
      tags: tags,
      userId: userId,
      commentsEnabled:
        hasComments && Math.random() < 0.5 ? true : false,
      slug: generateSlug(postTitle),
      status: 'published',
      dates: hasDates
        ? {
            start: startDate,
            end: endDate,
          }
        : null,
      parent: parent,
      image: image(),
      publishedAt: Date.now(),
    };

    const post = await models.Post.create(fakePost);

    if (post) {
      return post;
    } else {
      return;
    }
  } catch (err) {
    console.log(err);
    return false;
  }
};

const dataTypePicker = async (parent) => {
  if (parent) {
    const parents = dataTypes.filter((type) => !type.requiresParent);
    return parents[Math.floor(Math.random() * parents.length)];
  }

  const children = dataTypes.filter((type) => type.requiresParent);
  return children[Math.floor(Math.random() * children.length)];
};

const createCompleteFake = async () => {
  const LIMIT = 250;
  try {
    const spinner = ora('Creating fake data').start();

    // Create users
    for (let step = 0; step < LIMIT; step++) {
      spinner.text = `Creating fake users [${step}/${LIMIT}]`;

      const user = await createFakeUser();
    }

    // Create parent posts
    for (let step = 0; step < LIMIT; step++) {
      spinner.text = `Creating fake parent posts [${step}/${LIMIT}]`;

      const dataType = await dataTypePicker(true);

      const randomUsers = await models.User.aggregate([
        { $sample: { size: 1 } },
      ]);

      const parent = await createFakePost({
        dataType,
        userId: randomUsers[0],
      });

      await models.User.findByIdAndUpdate(randomUsers[0]._id, {
        $addToSet: { posts: parent },
      });
    }

    // Create child posts
    for (let step = 0; step < LIMIT; step++) {
      spinner.text = `Creating fake child posts [${step}/${LIMIT}]`;

      const dataType = await dataTypePicker();

      const randomPosts = await models.Post.aggregate([
        { $match: { type: dataType.parentType } },
        { $sample: { size: 1 } },
      ]);

      const user = await models.User.findOne(randomPosts[0].userId);

      const child = await createFakePost({
        parent: randomPosts[0],
        dataType,
        userId: user,
      });

      await models.Post.findByIdAndUpdate(randomPosts[0]._id, {
        $addToSet: { children: child },
      });

      user.posts.push(child);
      user.save();
    }

    spinner.stop();
    // Create comment threads
  } catch (err) {
    console.log(err);
    return false;
  }
};

export default createCompleteFake;
