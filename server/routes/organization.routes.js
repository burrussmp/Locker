/* eslint-disable new-cap */
/* eslint-disable max-len */
import express from 'express';
import orgCtrl from '@server/controllers/organization.controller';
import authCtrl from '@server/controllers/auth.controller';
import relationshipCtrl from '@server/controllers/relationship.controller';
import permission from '@server/permissions';

const OrganizationPermissions = permission.OrganizationPermissions;

const router = express.Router();

router.param('organizationId', orgCtrl.organizationByID);

router.route('/api/organizations')
    .get(authCtrl.authorize([], false), orgCtrl.list)
    .post(authCtrl.authorize([OrganizationPermissions.Create]), orgCtrl.create);

router.route('/api/organizations/:organizationId')
    .get(authCtrl.authorize([], false), orgCtrl.read)
    .put(authCtrl.authorize([OrganizationPermissions.EditContent]), orgCtrl.enforceSameOrganization, orgCtrl.update)
    .delete(authCtrl.authorize([OrganizationPermissions.Delete]), orgCtrl.enforceSameOrganization, orgCtrl.remove);

router.route('/api/organizations/:organizationId/logo')
    .post(authCtrl.authorize([OrganizationPermissions.EditContent]), orgCtrl.enforceSameOrganization, orgCtrl.updateLogo)
    .get(authCtrl.authorize([], false), orgCtrl.getLogo);

router.route('/api/organizations/:organizationId/employees')
    .post(authCtrl.authorize([OrganizationPermissions.AddEmployee]), orgCtrl.addEmployee)
    .delete(authCtrl.authorize([OrganizationPermissions.DeleteEmployee]), orgCtrl.enforceSameOrganization, orgCtrl.removeEmployee);

router.route('/api/organizations/:organizationId/follow')
    .get(authCtrl.authorize([OrganizationPermissions.Follow]), relationshipCtrl.listFollow('Organization'))
    .put(authCtrl.authorize([OrganizationPermissions.Follow]), relationshipCtrl.follow('Organization'))
    .delete(authCtrl.authorize([OrganizationPermissions.Follow]), relationshipCtrl.unfollow('Organization'));


export default router;
