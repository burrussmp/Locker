/* eslint-disable new-cap */
/* eslint-disable max-len */
// imports
import express from 'express';
import employeeCtrl from '@server/controllers/employee.controller';
import authCtrl from '@server/controllers/auth.controller';
import permission from '@server/permissions';

const EmployeePermissions = permission.EmployeePermissions;

// create new router
const router = express.Router();

// handle path parameters
router.param('employeeId', employeeCtrl.employeeByID);

router.route('/api/employees')
    .get(authCtrl.authorize([EmployeePermissions.Read]), employeeCtrl.list)
    .post(authCtrl.authorize([EmployeePermissions.Create]), employeeCtrl.create);

router.route('/api/employees/:employeeId')
    .get(authCtrl.authorize([EmployeePermissions.Read]), employeeCtrl.read)
    .put(authCtrl.authorize([EmployeePermissions.EditContent]), authCtrl.requireOwnership, employeeCtrl.update)
    .delete(authCtrl.authorize([EmployeePermissions.Delete]), authCtrl.requireOwnership, employeeCtrl.remove);

router.route('/api/employees/:employeeId/avatar')
    .get(authCtrl.authorize([EmployeePermissions.Read]), employeeCtrl.getProfilePhoto)
    .post(authCtrl.authorize([EmployeePermissions.EditContent]), authCtrl.requireOwnership, employeeCtrl.uploadProfilePhoto)
    .delete(authCtrl.authorize([EmployeePermissions.Delete]), authCtrl.requireOwnership, employeeCtrl.removeProfilePhoto);

router.route('/api/employees/:employeeId/password')
    .put(authCtrl.authorize([EmployeePermissions.EditContent]), authCtrl.requireOwnership, employeeCtrl.changePassword);

router.route('/api/employees/:employeeId/role')
    .put(authCtrl.authorize([EmployeePermissions.ChangeRole]), employeeCtrl.changeRole);


export default router;
