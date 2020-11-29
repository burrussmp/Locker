'use strict';

import Basic from './products.basics.test';
import Specific from './products.specific.test';

const productTests = () => {
  describe('PATH: \'/api/ent/products/\'', Basic);
  describe('PATH: \'/api/ent/products/:productId/\'', Specific);
};

export default productTests;
