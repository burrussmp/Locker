'use strict';

import BasicTest from './organization.basics.test';
import SpecificTest from './organization.specific.test';

const organizationTest = () => {
  // describe('PATH: \'api/ent/organizations/\'', BasicTest);
  describe('PATH: \'api/ent/organizations/:organizationId\'', SpecificTest);
};

export default organizationTest;
