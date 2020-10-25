"use strict";

import BasicTest from './AuthTests/Auth.basics';
import RBACTest from './AuthTests/RBAC.test';

const user_tests = () => {
    describe("PATH: '/auth/'", BasicTest);
    describe("RBAC Tests", RBACTest)
}

export default user_tests;