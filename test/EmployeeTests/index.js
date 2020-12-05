/* eslint-disable max-len */
'use strict';

import BasicTest from './employee.basic.test';
import EmployeeSpecific from './employee.specific.test';
import EmployeeAvatar from './employee.avatar.test';
import EmployeePassword from './employee.password.test';
import EmployeeRole from './employee.role.test';


const employeeTests = () => {
  describe('PATH: \'/api/employees\'', BasicTest);
//   describe('PATH: \'/api/employees/:employeeId\'', EmployeeSpecific);
//   describe('PATH: \'/api/employees/:employeeId/avatar\'', EmployeeAvatar);
//   describe('PATH: \'/api/employees/:employeeId/password\'', EmployeePassword);
//   describe('PATH: \'/api/employees/:employeeId/role\'', EmployeeRole);
};

export default employeeTests;
