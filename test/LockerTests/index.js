'use strict';

import LockerTests from './LockerTests/index';
import LockerCollectionTests from './LockerCollectionTests/index';
import MultipleLockerTests from './MultipleLockerTests';

export default () => {
  // describe("PATH: '/api/lockers'", LockerTests);
  // describe("PATH: '/api/lockers/:lockerId/collections'", LockerCollectionTests);
  describe("PATH: '/api/lockers/:lockerId/collections/:collectionId/*'", MultipleLockerTests);
};
