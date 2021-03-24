import { PubSub } from 'apollo-server';

import * as JOB_EVENTS from './job';

export const EVENTS = {
  JOB: JOB_EVENTS,
};

export default new PubSub();
