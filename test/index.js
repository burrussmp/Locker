import UserTest from './user.test';
import AuthTest from './auth.test';
import PostTest from './post.test';
import MediaTest from './media.test';
import SearchTest from './search.test';
import OrganizationTest from './OrganizationTests/index';
import EmployeeTest from './EmployeeTests/index';
import {dropDatabase} from './helper';


// dropDatabase();
// describe('Auth Tests', AuthTest);
describe('User Tests', UserTest);
// describe('Post Test',PostTest)
// describe('Media Test',MediaTest)
// describe('Organization Test', OrganizationTest)
// describe('Employee Test', EmployeeTest);
