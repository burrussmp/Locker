"use strict";

import ProfileTest from './UserTests/profile.test';
import BaseTest from './UserTests/base.test';
import AvatarTest from './UserTests/avatar.test';
import UpdatePasswordTest from './UserTests/changepassword.test';
import FollowTest from './UserTests/follow.test';

const user_tests = () => {
    // describe("PATH: '/api/users/'", BaseTest);
    // describe("PATH: '/api/users/:userId'", ProfileTest);
    describe("PATH /api/users/:userId/avatar",AvatarTest)
    // describe("PATH /api/users/:userId/password",UpdatePasswordTest)
    // describe("PATH /api/users/:userId/follow",FollowTest)
}

export default user_tests;