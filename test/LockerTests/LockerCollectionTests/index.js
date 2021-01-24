'use strict';

import BasicTests from './lockercollection.basics.test.js';
import SpecificTests from './lockercollection.specific.test';
import ProductTests from './lockercollection.products.test';

export default () => {
  describe("PATH: '/api/lockers/:lockerId/collections'", BasicTests);
  describe("PATH: '/api/lockers/:lockerId/collections/:lockerCollectionId'", SpecificTests);
  describe("PATH: '/api/lockers/:lockerId/collections/:lockerCollectionId/products'", ProductTests);
};
