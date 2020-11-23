/* eslint-disable max-len */
import chai from 'chai';
import chaiHttp from 'chai-http';
import {app} from '../../server/server';
import {OrganizationData, getConstructorData} from '../../development/organization.data';
import Organization from '../../server/models/organization.model';
import StaticStrings from '../../config/StaticStrings';
import {dropDatabase} from '../helper';


chai.use(chaiHttp);
chai.should();

const organizationBasicsTest = () => {
  describe('Basics Test', ()=>{
    describe('GET/POST /api/organizations`', ()=>{
      const agent = chai.request.agent(app);
      before(async ()=>{
        await dropDatabase();
      });
      it('Create a new organization (not logged in)', async ()=>{
        const organizationData = OrganizationData[0];
        return agent.post(`/api/ent/organizations`)
            .attach('media', organizationData.logo)
            .field(getConstructorData(organizationData))
            .then((res)=>{
              res.status.should.eql(401);
              res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
            });
      });
    });
  });
};

export default organizationBasicsTest;
