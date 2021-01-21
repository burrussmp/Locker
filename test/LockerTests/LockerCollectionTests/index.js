'use strict';

import BasicTests from './basics.test.js';
import SpecificTests from './specific.test';

export default () => {
  // describe("PATH: '/api/lockers/:lockerId/collections'", BasicTests);
  describe("PATH: '/api/lockers/:lockerId/collections/:lockerCollectionId'", SpecificTests);
};
