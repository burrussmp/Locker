"use strict";

import BasicTest from './AuthTests/Auth.basics';

const user_tests = () => {
    describe("PATH: '/auth/'", BasicTest);
}

export default user_tests;