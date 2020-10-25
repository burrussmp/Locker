import chai  from 'chai';
import chaiHttp from 'chai-http';
import {app} from '../../server/server';
import {OrganizationData, getConstructorData} from '../../development/organization.data';
import Organization from '../../server/models/organization.model';
import StaticStrings from '../../config/StaticStrings';
import {drop_database, createUser} from  '../helper';
import _ from 'lodash';
import permissions from '../../server/permissions';


chai.use(chaiHttp);
chai.should();

const organization_basics_test = () => {
    describe("Basics Test",()=>{
        describe("GET/POST /api/posts/:postId/comments",()=>{
            let agent = chai.request.agent(app);
            before (async()=>{
                await drop_database();
            });
            afterEach(async()=>{ 
                let organizations = await Organization.find();
                for (let organization of organizations){
                    await organization.deleteOne();
                }
            });
            it("Create a new organization (not admin should fail)",async()=>{
                const organization_data = OrganizationData[0];
                return agent.post(`/api/organizations`)
                    .attach("media",organization_data.logo)
                    .field(getConstructorData(organization_data))
                    .then((res)=>{
                        res.status.should.eql(401);
                        res.body.error.should.eql(StaticStrings.UnauthorizedAdminRequired);
                })
            })
        });
    })
}

export default organization_basics_test;