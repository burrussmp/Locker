import AuthTest from '@test/AuthTests/index';
import UserTest from '@test/UserTests/index';
import CommentTest from '@test/CommentTests/index';
import PostTest from '@test/PostTests/index';
import MediaTest from '@test/MediaTests/index';
import SearchTest from '@test/SearchTests/index';
import OrganizationTest from '@test/OrganizationTests/index';
import EmployeeTest from '@test/EmployeeTests/index';
import ProductTest from '@test/ProductTests/index';
// import {dropDatabase} from '@test/helper';


// dropDatabase();
describe('Auth Tests', AuthTest);
describe('User Tests', UserTest);
describe('Post Test', PostTest);
describe('Comment Test', CommentTest);
describe('Media Test', MediaTest);
describe('Organization Test', OrganizationTest);
describe('Employee Test', EmployeeTest);
describe('Product Tests', ProductTest);
