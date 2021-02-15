/* eslint-disable max-len */
import chai from 'chai';
import chaiHttp from 'chai-http';

import {app} from '@server/server';
import User from '@server/models/user.model';
import Organization from '@server/models/organization.model';
import RBAC from '@server/models/rbac.model';

import StreamClient from '@server/services/stream/client';

import StaticStrings from '@config/StaticStrings';

import { UserData } from '@development/user.data'
import {OrganizationData} from '@development/organization.data';
import {dropDatabase, createUser, loginAdminEmployee, createOrg} from '@test/helper';

chai.use(chaiHttp);
chai.should();

const followTest = () => {
  describe('Organization Follows/Following Test', ()=>{

    const agent = chai.request.agent(app);
    describe('GET /api/organizations/:organizationId/follow', ()=>{
      let url = `/api/organizations/:organizationId/follow`;
      let admin; let org;
      let user1;
      before( async () =>{
        await dropDatabase();
        user1 = await createUser(UserData[0]);
        admin = await loginAdminEmployee();
        org = await createOrg(admin.access_token, OrganizationData[0]);
        url = url.replace(':organizationId', org._id);
      });
      it('GET Following - Organization has no followers', async ()=>{
        return agent.get(`${url}?access_token=${user1.access_token}`)
            .then((res)=>{
              res.status.should.eql(200);
              res.body.followers.length.should.eql(0);
              res.body.following.length.should.eql(0);
            });
      });
      it('GET Following - User not logged in (should fail)', async ()=>{
        return agent.get(`${url}`)
            .then((res)=>{
              res.status.should.eql(401);
              res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
            });
      });
      it('Ger Following - Organization does not exists (should fail)', async ()=>{
        return agent.get(`/api/organizations/${user1._id}/follow?access_token=${user1.access_token}`)
            .then((res)=>{
              res.status.should.eql(404);
              res.body.error.should.eql(StaticStrings.OrganizationControllerErrors.NotFoundError);
            });
      });
      it('Invalid permissions (should fail)', async ()=>{
        const NARole = await RBAC.findOne({'role': 'none'});
        await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': NARole._id}, {new: true});
        return agent.get(`${url}?access_token=${user1.access_token}`)
            .then(async (res)=>{
              res.status.should.eql(403);
              res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
            });
      });
    });
    describe('PUT /api/organizations/:organizationId/follow', ()=>{
        let url = `/api/organizations/:organizationId/follow`;
        let admin; let org;
        let user1; let user2;
        beforeEach( async () =>{
            await dropDatabase();
            user1 = await createUser(UserData[0]);
            user2 = await createUser(UserData[1]);
            admin = await loginAdminEmployee();
            org = await createOrg(admin.access_token, OrganizationData[0]);
            url = `/api/organizations/:organizationId/follow`;
            url = url.replace(':organizationId', org._id);
        });
        it('Add follower - Follow an organization (both should properly update)', async ()=>{
            return agent.put(`${url}?access_token=${user1.access_token}`).then(async (res)=>{
                res.status.should.eql(200);
                res.body.message.should.eql(StaticStrings.AddedFollowerSuccess);
                (await User.findById(user1._id)).following.length.should.eql(1);
                (await Organization.findById(org._id)).followers.length.should.eql(1);
            });
        });
        it('Add follower - Stream setup where user now follows organization', async ()=>{
            return agent.put(`${url}?access_token=${user1.access_token}`).then(async (res)=>{
                res.status.should.eql(200);
                const orgFollowers = (await StreamClient.feed.getFollowers.Organization(org._id.toString())).results;
                orgFollowers.length.should.eql(1);
                orgFollowers[0].feed_id.split(':')[1].should.eql(user1._id.toString())
                
                const userFollowing = (await StreamClient.feed.getFollowing.User(user1._id.toString())).results;
                userFollowing.length.should.eql(1);
                userFollowing[0].target_id.split(':')[1].should.eql(org._id.toString())
            });
        });
        it('Add follower - Follow twice with same person', async ()=>{
            return agent.put(`${url}?access_token=${user1.access_token}`).then((res)=>{
                res.status.should.eql(200);
                return agent.put(`${url}?access_token=${user1.access_token}`).then(async (res)=>{
                    res.status.should.eql(200);
                    (await User.findById(user1._id)).following.length.should.eql(1);
                    (await Organization.findById(org._id)).followers.length.should.eql(1);
                });
            });
        });
        it('Add follower - Follow twice with different people', async ()=>{
            return agent.put(`${url}?access_token=${user1.access_token}`).then(()=>{
                return agent.put(`${url}?access_token=${user2.access_token}`).then(async ()=>{
                        (await User.findById(user1._id)).following.length.should.eql(1);
                        (await User.findById(user2._id)).following.length.should.eql(1);
                        (await Organization.findById(org._id)).followers.length.should.eql(2);
                    });
                });
        });
        it('Add follower - Not logged in (should fail)', async ()=>{
            return agent.put(`${url}`).then((res)=>{
                res.status.should.eql(401);
                res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
            });
        });
        it('Invalid permissions (should fail)', async ()=>{
            const NARole = await RBAC.findOne({'role': 'none'});
            await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': NARole._id}, {new: true});
            return agent.get(`${url}?access_token=${user1.access_token}`).then(async (res)=>{
                res.status.should.eql(403);
                res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
            });
        });
    });
    describe('DELETE /api/organizations/:organizationId/follow', ()=>{
        let url = `/api/organizations/:organizationId/follow`;
        let admin; let org;
        let user1;
        beforeEach( async () =>{
            await dropDatabase();
            user1 = await createUser(UserData[0]);
            admin = await loginAdminEmployee();
            org = await createOrg(admin.access_token, OrganizationData[0]);
            url = `/api/organizations/:organizationId/follow`;
            url = url.replace(':organizationId', org._id);
            agent.put(`${url}?access_token=${user1.access_token}`);
        });
      it('Unfollow - Unfollow an organization successfully', async ()=>{
        return agent.delete(`${url}?access_token=${user1.access_token}`).then((res)=>{
            res.status.should.least(200);
            res.body.message.should.eql(StaticStrings.RemovedFollowerSuccess);
            return agent.get(`${url}?access_token=${user1.access_token}`).then((res)=>{
                res.status.should.eql(200);
                res.body.followers.length.should.eql(0);
                res.body.following.length.should.eql(0);
            });
        });
      });
      it('Unfollow - Stream successfully called to clean up', async ()=>{
        return agent.delete(`${url}?access_token=${user1.access_token}`).then(async (res)=>{
            res.status.should.least(200);
            const orgFollowers = (await StreamClient.feed.getFollowers.Organization(org._id.toString())).results;
            orgFollowers.length.should.eql(0);
            const userFollowing = (await StreamClient.feed.getFollowing.User(user1._id.toString())).results;
            userFollowing.length.should.eql(0);
        });
      });
      it('Unfollow - Perform twice, should succeed and no-op', async ()=>{
        return agent.delete(`${url}?access_token=${user1.access_token}`).then((res)=>{
              res.status.should.eql(200);
              return agent.delete(`${url}?access_token=${user1.access_token}`).then((res)=>{
                  res.status.should.eql(200);
            });
        });
      });
      it('Unfollow - Not logged in (should fail)', async ()=>{
        return agent.delete(`${url}`).then((res)=>{
            res.status.should.eql(401);
            res.body.error.should.eql(StaticStrings.UnauthorizedMissingTokenError);
        });
      });
      it('Unfollow - Organization does not exists (should fail)', async ()=>{
        return agent.delete(`/api/organizations/bad/follow?access_token=${user1.access_token}`).then((res)=>{
            res.status.should.eql(404);
            res.body.error.should.eql(StaticStrings.OrganizationControllerErrors.NotFoundError);
        });
      });
      it('Unfollow - Invalid permissions (should fail)', async ()=>{
        const NARole = await RBAC.findOne({'role': 'none'});
        await User.findOneAndUpdate({'username': UserData[0].username}, {'permissions': NARole._id}, {new: true});
        return agent.delete(`${url}?access_token=${user1.access_token}`).then(async (res)=>{
            res.status.should.eql(403);
            res.body.error.should.eql(StaticStrings.InsufficientPermissionsError);
        });
      });
    });
    describe('Organization Follow Integration: User A and B follow an organization and A follows B to start', ()=>{
        let url = `/api/organizations/:organizationId/follow`;
        let admin; let org;
        let user1; let user2;
        beforeEach( async () =>{
            await dropDatabase();
            user1 = await createUser(UserData[0]);
            user2 = await createUser(UserData[1])
            admin = await loginAdminEmployee();
            org = await createOrg(admin.access_token, OrganizationData[0]);
            url = `/api/organizations/:organizationId/follow`;
            url = url.replace(':organizationId', org._id);
            await agent.put(`${url}?access_token=${user1.access_token}`).then();
            await agent.put(`/api/users/${user2._id}/follow?access_token=${user1.access_token}`).then();
            await agent.put(`${url}?access_token=${user2.access_token}`).then();
        });
        after( async ()=>{
            await dropDatabase();
        });
        it('Organization follow: Organization is deleted - Following of User A and User B cleaned up.', async ()=>{
            (await User.findById(user1._id)).following.length.should.eql(2);
            (await User.findById(user2._id)).following.length.should.eql(1);
            return agent.delete(`/api/organizations/${org._id}?access_token=${admin.access_token}`).then(async (res)=>{
                res.status.should.eql(200);
                (await User.findById(user1._id)).following.length.should.eql(1);
                (await User.findById(user2._id)).following.length.should.eql(0);
            });
        });
        it('Organization follow: Organization is deleted - Stream cleaned up following for User A, User B, and Organization.', async ()=>{
            const orgFollowers = (await StreamClient.feed.getFollowers.Organization(org._id.toString())).results;
            orgFollowers.length.should.eql(2);
            const userFollowing1 = (await StreamClient.feed.getFollowing.User(user1._id.toString())).results;
            userFollowing1.length.should.eql(2);
            const userFollowing2 = (await StreamClient.feed.getFollowing.User(user2._id.toString())).results;
            userFollowing2.length.should.eql(1);
            return agent.delete(`/api/organizations/${org._id}?access_token=${admin.access_token}`).then(async (res)=>{
                res.status.should.least(200);
                const orgFollowers = (await StreamClient.feed.getFollowers.Organization(org._id.toString())).results;
                orgFollowers.length.should.eql(0);
                const userFollowing1 = (await StreamClient.feed.getFollowing.User(user1._id.toString())).results;
                userFollowing1.length.should.eql(1);
                const userFollowing2 = (await StreamClient.feed.getFollowing.User(user2._id.toString())).results;
                userFollowing2.length.should.eql(0);
            });
        });

        it('Organization follow: User A is deleted - Organization and User B followers cleaned', async ()=>{
            (await Organization.findById(org._id)).followers.length.should.eql(2);
            (await User.findById(user2._id)).followers.length.should.eql(1);
            return agent.delete(`/api/users/${user1._id}?access_token=${admin.access_token}`).then(async (res)=>{
                res.status.should.eql(200);
                (await Organization.findById(org._id)).followers.length.should.eql(1);
                (await User.findById(user2._id)).followers.length.should.eql(0);
            });
        });
        it('Organization follow: User A is deleted - Stream cleaned up', async ()=>{
            const orgFollowers = (await StreamClient.feed.getFollowers.Organization(org._id.toString())).results;
            orgFollowers.length.should.eql(2);
            const userFollowing1 = (await StreamClient.feed.getFollowing.User(user1._id.toString())).results;
            userFollowing1.length.should.eql(2);
            const userFollowing2 = (await StreamClient.feed.getFollowing.User(user2._id.toString())).results;
            userFollowing2.length.should.eql(1);
            return agent.delete(`/api/users/${user1._id}?access_token=${admin.access_token}`).then(async ()=>{
                const orgFollowers = (await StreamClient.feed.getFollowers.Organization(org._id.toString())).results;
                orgFollowers.length.should.eql(1);
                const userFollowing1 = (await StreamClient.feed.getFollowing.User(user1._id.toString())).results;
                userFollowing1.length.should.eql(0);
                const userFollowing2 = (await StreamClient.feed.getFollowing.User(user2._id.toString())).results;
                userFollowing2.length.should.eql(1);
            });
        });

        it('Organization follow: User B follows User A back and User A deleted', async ()=>{
            await agent.put(`/api/users/${user1._id}/follow?access_token=${user2.access_token}`).then();
            (await User.findById(user2._id)).followers.length.should.eql(1);
            (await User.findById(user2._id)).following.length.should.eql(2);
            return agent.delete(`/api/users/${user1._id}?access_token=${admin.access_token}`).then(async (res)=>{
                res.status.should.eql(200);
                (await User.findById(user2._id)).followers.length.should.eql(0);
                (await User.findById(user2._id)).following.length.should.eql(1);
            });
        });
        it('Organization follow: User B follows User A back and User A deleted - Stream cleaned up', async ()=>{
            await agent.put(`/api/users/${user1._id}/follow?access_token=${user2.access_token}`).then();
            
            const userFollowing1 = (await StreamClient.feed.getFollowers.User(user1._id.toString())).results;
            userFollowing1.length.should.eql(1);
            const userFollowing2 = (await StreamClient.feed.getFollowers.User(user2._id.toString())).results;
            userFollowing2.length.should.eql(1);
            return agent.delete(`/api/users/${user1._id}?access_token=${admin.access_token}`).then(async ()=>{
             
                const userFollowing1 = (await StreamClient.feed.getFollowers.User(user1._id.toString())).results;
                userFollowing1.length.should.eql(0);
                const userFollowing2 = (await StreamClient.feed.getFollowers.User(user2._id.toString())).results;
                userFollowing2.length.should.eql(0);
            });
        });
    });
  });
};

export default followTest;
