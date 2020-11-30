// import UserTest from './UserTests/index';
import AuthTest from './AuthTests/index';
import UserTest from './UserTests/index';
import CommentTest from './CommentTests/index';
import PostTest from './PostTests/index';
import MediaTest from './MediaTests/index';
import SearchTest from './SearchTests/index';
import OrganizationTest from './OrganizationTests/index';
import EmployeeTest from './EmployeeTests/index';
import ProductTest from './ProductTests/index';
// import {dropDatabase} from './helper';


// dropDatabase();
describe('Auth Tests', AuthTest);
describe('User Tests', UserTest);
describe('Post Test', PostTest);
// describe('Comment Test', CommentTest);
describe('Media Test', MediaTest);
describe('Organization Test', OrganizationTest);
describe('Employee Test', EmployeeTest);
describe('Product Tests', ProductTest);
