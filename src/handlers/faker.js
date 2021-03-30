import models from '../models';
import jobTypes from '../constants/jobTypes';
import venueTypes from '../constants/venueTypes';
import eventTypes from '../constants/eventTypes';
import cities from 'all-the-cities';
import faker from 'faker';
import generateSlug from './generateSlug';

const createFakeUser = async () => {
  try {
    const fakeUser = {
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password: faker.internet.password(
        8,
        false,
        /^[a-zA-Z0-9_.-]*$/,
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

const createFakeCompany = async (user) => {
  try {
    const fakeCompany = {
      title: faker.company.companyName(),
      image: faker.image.business(200, 200, true),
      website: faker.internet.url(),
      tagline: faker.hacker.phrase(),
      userId: user._id,
    };

    const company = await models.Company.create(fakeCompany);

    await models.User.findByIdAndUpdate(user._id, {
      company: company._id,
    });

    if (company) {
      return company;
    } else {
      throw new Error();
    }
  } catch (err) {
    console.log(err);
  }
};

const createFakeJob = async (user, company) => {
  try {
    const fakeCity =
      cities[Math.floor(Math.random() * cities.length)];

    let location;

    let tags = [];

    for (let i = 0; i < Math.floor(Math.random() * 10 + 1); i++) {
      tags.push(faker.random.word());
    }

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

    const fakeJob = {
      title: faker.name.jobTitle(),
      location: location,
      description: `<h1>${faker.lorem.words(6)}</h1>
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
      types: jobTypes[Math.floor(Math.random() * jobTypes.length)],
      url:
        Math.random() < 0.5
          ? faker.internet.url()
          : faker.internet.email(),
      tags: tags,
    };

    const job = await models.Job.create({
      slug: generateSlug(fakeJob.title),
      parent: company._id,
      parentName: company.title,
      status: 'published',
      publishedAt: Date.now(),
      ...fakeJob,
    });

    if (job) {
      return job;
    } else {
      return false;
    }
  } catch (err) {
    console.log(err);
    return false;
  }
};

const createFakeVenue = async (user) => {
  try {
    const fakeCity =
      cities[Math.floor(Math.random() * cities.length)];

    let location;

    let tags = [];

    for (let i = 0; i < Math.floor(Math.random() * 10 + 1); i++) {
      tags.push(faker.random.word());
    }

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

    const fakeVenue = {
      title: faker.commerce.productName(),
      location: location,
      description: `<h1>${faker.lorem.words(6)}</h1>
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
        venueTypes[Math.floor(Math.random() * venueTypes.length)],
      url:
        Math.random() < 0.5
          ? faker.internet.url()
          : faker.internet.email(),
      tags: tags,
    };

    const venue = await models.Venue.create({
      userId: user.id,
      slug: generateSlug(fakeVenue.title),
      status: 'published',
      image: faker.image.city(200, 200, true),
      publishedAt: Date.now(),
      ...fakeVenue,
    });

    if (venue) {
      return venue;
    } else {
      return false;
    }
  } catch (err) {
    console.log(err);
    return false;
  }
};

const createFakeEvent = async (venue) => {
  try {
    const fakeCity =
      cities[Math.floor(Math.random() * cities.length)];

    let location;

    let tags = [];

    for (let i = 0; i < Math.floor(Math.random() * 10 + 1); i++) {
      tags.push(faker.random.word());
    }

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

    const startDate = faker.date.recent();

    const fakeEvent = {
      title: `${faker.music.genre()} ${faker.address.city()} ${faker.commerce.product()} ${faker.date.weekday()}`,
      location: location,
      description: `<h1>${faker.lorem.words(6)}</h1>
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
        eventTypes[Math.floor(Math.random() * eventTypes.length)],
      url:
        Math.random() < 0.5
          ? faker.internet.url()
          : faker.internet.email(),
      tags: tags,
    };

    const event = await models.Event.create({
      slug: generateSlug(fakeEvent.title),
      status: 'published',
      dates: {
        start: startDate,
        end: faker.date.soon(3, startDate),
      },
      parent: venue,
      image: faker.image.nightlife(200, 200, true),
      publishedAt: Date.now(),
      ...fakeEvent,
    });

    if (event) {
      return event;
    } else {
      return false;
    }
  } catch (err) {
    console.log(err);
    return false;
  }
};

const createCompleteFake = async () => {
  try {
    for (let step = 0; step < 250; step++) {
      const user = await createFakeUser();

      const company = await createFakeCompany(user);

      const job = await createFakeJob(user, company);

      const venue = await createFakeVenue(user);

      const event = await createFakeEvent(venue);

      console.log('Created fake data', step);
    }
  } catch (err) {
    console.log(err);
    return false;
  }
};

export default createCompleteFake;
