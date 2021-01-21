'use strict';

import LockerTests from './LockerTests/index';
import LockerCollectionTests from './LockerCollectionTests/index';

export default () => {
  // describe("PATH: '/api/lockers'", LockerTests);
  describe("PATH: '/api/lockers/:lockerId/collections'", LockerCollectionTests)
};
