import chai from "chai";
import chaiHttp from "chai-http";
import { app } from "../../server/server";
import RBAC from "../../server/models/rbac.model";
import StaticStrings from "../../config/StaticStrings";
const fs = require("fs").promises;
import _ from "lodash";
import permissionCtrl from '../../server/permissions';

chai.use(chaiHttp);
chai.should();

const rbac_tests = () => {
  describe("Role-based access control (RBAC) tests", () => {
    describe("Create RBAC entry",()=>{
        it("Check for admin role exists", async() => {
            const role = await RBAC.findOne({role: 'admin'})
            role.role.should.eql('admin');
        });
        it("Check for user role exists", async() => {
            const role = await RBAC.findOne({role: 'user'})
            role.role.should.eql('user');
        });
        it("Check if hasPermission works", async()=>{
            const role = await RBAC.findOne({role: 'user'});
            role.hasPermission('user:read').should.be.true;
            role.hasPermission(['user:read', 'user:delete']).should.be.true;
            role.hasPermission('user:crazy').should.be.false;
        });
        it("Check if addPermission works", async()=>{
            const role = await RBAC.findOne({role: 'user'});
            await role.addPermission('user:crazy');
            role.hasPermission('user:crazy').should.be.true;
        });
        it("Check if removePermission works", async()=>{
            const role = await RBAC.findOne({role: 'user'});
            await role.addPermission('user:crazy');
            await role.removePermission('user:crazy');
            role.hasPermission('user:crazy').should.be.false;
        });
        it("Check if setrole works", async()=>{
            const role = await RBAC.findOne({role: 'user'});
            await role.addPermission('user:crazy');
            await role.removePermission('user:crazy');
            role.hasPermission('user:crazy').should.be.false;
        });
    });
  });
}

export default rbac_tests;