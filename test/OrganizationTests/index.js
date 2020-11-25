'use strict';

import BasicTest from './organization.basics.test';
import SpecificTest from './organization.specific.test';
import LogoTest from './organization.logo.test';

const organizationTest = () => {
  // describe('PATH: \'api/ent/organizations/\'', BasicTest);
  // describe('PATH: \'api/ent/organizations/:organizationId\'', SpecificTest);
  describe('PATH: \'api/ent/organizations/:organizationId/logo\'', LogoTest);
};

export default organizationTest;
