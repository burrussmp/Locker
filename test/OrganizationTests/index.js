/* eslint-disable max-len */
'use strict';

import BasicTest from './organization.basics.test';
import SpecificTest from './organization.specific.test';
import LogoTest from './organization.logo.test';
import EmployeeTest from './organization.employee.test';

const organizationTest = () => {
  describe('PATH: \'api/ent/organizations/\'', BasicTest);
  describe('PATH: \'api/ent/organizations/:organizationId\'', SpecificTest);
  describe('PATH: \'api/ent/organizations/:organizationId/employee\'', EmployeeTest);
  describe('PATH: \'api/ent/organizations/:organizationId/logo\'', LogoTest);
};

export default organizationTest;
