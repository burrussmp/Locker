'use strict';

import BasicTests from './basics.test.js';
import SpecificTests from './specific.test';
import ProductTests from './products.test';

export default () => {
  describe("PATH: '/api/lockers'", BasicTests);
    // describe("PATH: '/api/lockers/:lockerId'", SpecificTests);
    // describe("PATH: '/api/lockers/:lockerId/products", ProductTests)
};
