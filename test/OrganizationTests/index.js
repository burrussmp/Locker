/**
 * @desc Tests for organization
 * @author Matthew P. burruss
 * @date 2/15/2021
 */

import BasicTest from '@test/OrganizationTests/organization.basics.test';
import SpecificTest from '@test/OrganizationTests/organization.specific.test';
import LogoTest from '@test/OrganizationTests/organization.logo.test';
import EmployeeTest from '@test/OrganizationTests/organization.employee.test';
import FollowTest from '@test/OrganizationTests/organization.follow.test';

const organizationTest = () => {
  // describe('PATH: \'api/organizations/\'', BasicTest);
  // describe('PATH: \'api/organizations/:organizationId\'', SpecificTest);
  // describe('PATH: \'api/organizations/:organizationId/employee\'', EmployeeTest);
  // describe('PATH: \'api/organizations/:organizationId/logo\'', LogoTest);
  describe('PATH: \'api/organizations/:organizationId/follow\'', FollowTest);
};

export default organizationTest;
