/* eslint-disable max-len */
'use strict';

import BasicTest from './organization.basics.test';
import SpecificTest from './organization.specific.test';
import LogoTest from './organization.logo.test';
import EmployeeTest from './organization.employee.test';

const organizationTest = () => {
  describe('PATH: \'api/organizations/\'', BasicTest);
  describe('PATH: \'api/organizations/:organizationId\'', SpecificTest);
  describe('PATH: \'api/organizations/:organizationId/employee\'', EmployeeTest);
  describe('PATH: \'api/organizations/:organizationId/logo\'', LogoTest);
};

export default organizationTest;
