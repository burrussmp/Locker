import UserTest from './user.test';
import AuthTest from './auth.test';
import PostTest from './post.test';
import {drop_database} from './helper';

// (async()=>{
//     await drop_database()
// })()


describe('Auth Tests',AuthTest)
// describe('User Tests',UserTest)
// describe('Post Test',PostTest)