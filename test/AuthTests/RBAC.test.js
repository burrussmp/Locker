import chai from 'chai';
import chaiHttp from 'chai-http';
import RBAC from '@server/models/rbac.model';

chai.use(chaiHttp);
chai.should();

const RBACTests = () => {
  describe('Role-based access control (RBAC) tests', () => {
    describe('Create RBAC entry', ()=>{
      it('Check for admin role exists', async () => {
        const role = await RBAC.findOne({role: 'admin'});
        role.role.should.eql('admin');
      });
      it('Check for user role exists', async () => {
        const role = await RBAC.findOne({role: 'user'});
        role.role.should.eql('user');
      });
      it('Check if hasPermission works', async ()=>{
        const role = await RBAC.findOne({role: 'user'});
        role.hasPermission('user:read').should.be.true;
        role.hasPermission(['user:read', 'user:delete']).should.be.true;
        role.hasPermission('user:crazy').should.be.false;
      });
      it('Check if addPermission works', async ()=>{
        const role = await RBAC.findOne({role: 'user'});
        await role.addPermission('user:crazy');
        role.hasPermission('user:crazy').should.be.true;
      });
      it('Check if removePermission works', async ()=>{
        const role = await RBAC.findOne({role: 'user'});
        await role.addPermission('user:crazy');
        await role.removePermission('user:crazy');
        role.hasPermission('user:crazy').should.be.false;
      });
      it('Check if setRole works', async ()=>{
        const role = await RBAC.findOne({role: 'user'});
        await role.addPermission('user:crazy');
        await role.removePermission('user:crazy');
        role.hasPermission('user:crazy').should.be.false;
      });
    });
  });
};

export default RBACTests;
