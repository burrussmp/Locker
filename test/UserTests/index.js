'use strict';

import ProfileTest from './profile.test';
import BaseTest from './base.test';
import AvatarTest from './avatar.test';
import UpdatePasswordTest from './changepassword.test';
import FollowTest from './follow.test';

const userTests = () => {
  describe('PATH: \'/api/users/\'', BaseTest);
  describe('PATH: \'/api/users/:userId\'', ProfileTest);
  describe('PATH /api/users/:userId/avatar', AvatarTest);
  describe('PATH /api/users/:userId/password', UpdatePasswordTest);
  describe('PATH /api/users/:userId/follow', FollowTest);
};

export default userTests;
