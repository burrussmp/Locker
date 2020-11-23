/* eslint-disable max-len */
'use strict';

import BasicTest from './employee.basic.test';
import EmployeeSpecific from './employee.specific.test';
import EmployeeAvatar from './employee.avatar.test';
import EmployeePassword from './employee.password.test';
// import EmployeeRole from './employee.role.test';


const employeeTests = () => {
  describe('PATH: \'/api/ent/employees\'', BasicTest);
  describe('PATH: \'/api/ent/employees/:employeeId\'', EmployeeSpecific);
  describe('PATH: \'/api/ent/employees/:employeeId/avatar\'', EmployeeAvatar);
  describe('PATH: \'/api/ent/employees/:employeeId/password\'', EmployeePassword);
  // describe('PATH: \'/api/ent/employees/:employeeId/role\'', EmployeeRole);
};

export default employeeTests;
