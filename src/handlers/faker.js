import models from '../models';
import jobTypes from '../constants/jobTypes';
import venueTypes from '../constants/venueTypes';
import regions from '../constants/regions';
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
      name: faker.company.companyName(),
      logo: faker.image.business(200, 200, true),
      website: faker.internet.url(),
      tagline: faker.lorem.sentence(),
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
      regions: regions[Math.floor(Math.random() * regions.length)],
      types: jobTypes[Math.floor(Math.random() * jobTypes.length)],
      url:
        Math.random() < 0.5
          ? faker.internet.url()
          : faker.internet.email(),
      tags: tags,
    };

    const job = await models.Job.create({
      userId: user.id,
      slug: generateSlug(fakeJob.title),
      company: company._id,
      companyName: company.name,
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
      title: faker.company.companyName(),
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
      regions: regions[Math.floor(Math.random() * regions.length)],
      types:
        venueTypes[Math.floor(Math.random() * venueTypes.length)],
      url:
        Math.random() < 0.5
          ? faker.internet.url()
          : faker.internet.email(),
      tags: tags,
    };

    const job = await models.Venue.create({
      userId: user.id,
      slug: generateSlug(fakeVenue.title),
      status: 'published',
      logo: faker.image.business(200, 200, true),
      publishedAt: Date.now(),
      ...fakeVenue,
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

const createCompleteFake = async () => {
  try {
    for (let step = 0; step < 250; step++) {
      const user = await createFakeUser();

      const company = await createFakeCompany(user);

      const job = await createFakeJob(user, company);

      const venue = await createFakeVenue(user);

      console.log('Created fake data', step);
    }
  } catch (err) {
    console.log(err);
    return false;
  }
};

export default createCompleteFake;
