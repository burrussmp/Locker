/* eslint-disable new-cap */
/* eslint-disable max-len */
import express from 'express';
import orgCtrl from '../controllers/organization.controller';
import authCtrl from '../controllers/auth.controller';
import permission from '../permissions';

const OrganizationPermissions = permission.OrganizationPermissions;

const router = express.Router();

router.param('organizationId', orgCtrl.organizationByID);

router.route('/api/ent/organizations')
    .get(authCtrl.authorize([], false), orgCtrl.list)
    .post(authCtrl.authorize([OrganizationPermissions.Create]), orgCtrl.create);

router.route('/api/ent/organizations/:organizationId')
    .get(authCtrl.authorize([], false), orgCtrl.read)
    .put(authCtrl.authorize([OrganizationPermissions.Edit]), orgCtrl.update)
    .delete(authCtrl.authorize([OrganizationPermissions.Delete]), orgCtrl.remove);

router.route('/api/ent/organizations/:organizationId/employees')
    .post(authCtrl.authorize([OrganizationPermissions.AddEmployee]), orgCtrl.addEmployee)
    .delete(authCtrl.authorize([OrganizationPermissions.DeleteEmployee]), orgCtrl.removeEmployee);

export default router;