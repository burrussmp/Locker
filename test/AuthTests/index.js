'use strict';

import BasicTest from './basic';
import RBACTest from './RBAC.test';

const authTests = () => {
  describe('PATH: \'/auth/\'', BasicTest);
  describe('RBAC Tests', RBACTest);
};

export default authTests;
