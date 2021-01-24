'use strict';

import CloneTests from './clone.test.js';
import IntegrationTests from './integration.test';
import ReferenceTests from './reference.test';

export default () => {
  describe("PATH: Integration tests for locker between users, lockers, collections, and products", IntegrationTests);
  describe("PATH: '/api/lockers/:lockerId/collections/:collectionId/reference'", ReferenceTests);
  describe("PATH: '/api/lockers/:lockerId/collections/:collectionId/clone'", CloneTests);
};
