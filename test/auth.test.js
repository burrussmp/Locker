// Import the dependencies for testing
import chai  from 'chai';
import chaiHttp from 'chai-http';
import {app} from '../server/server';

import {UserData} from '../development/user.data'
import {drop_database} from  './helper';
import User from '../server/models/user.model';

// Configure chai
chai.use(chaiHttp);
chai.should();

(async () => await drop_database())();

(async () => await drop_database())();
describe('Auth', () => {
    it(`Check if Empty`, (done) => {
        chai.request(app)
            .get('/api/users')
            .end(async (err, res) => {
            if (err){
                console.log(err);
            }
            res.should.have.status(200);
            res.body.should.have.lengthOf(0)
            done();
        });
    }); 
});