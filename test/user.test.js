// Import the dependencies for testing
import chai  from 'chai';
import chaiHttp from 'chai-http';
import {app} from '../server/server';

import {UserData} from '../development/user.data'
import {drop_database} from  './helper';
import User from '../server/models/user.model';
import StaticStrings from '../config/StaticStrings';
import S3_Services from '../server/services/S3.services';

// Configure chai
chai.use(chaiHttp);
chai.should();

// import AvatarTest from './UserTests/avatar.test';
import ProfileTest from './UserTests/profile.test';
import BaseTest from './UserTests/base.test';
import AvatarTest from './UserTests/avatar.test';
const user_tests = () => {
    //describe("PATH: '/api/users/'", BaseTest);
    //describe("PATH: '/api/users/:userId'", ProfileTest);
    describe("PATH /api/users/:userId/avatar",AvatarTest)
}

export default user_tests;