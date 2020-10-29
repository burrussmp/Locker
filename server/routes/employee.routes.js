// imports
import express from 'express'
import employeeCtrl from '../controllers/employee.controller';
import authCtrl from '../controllers/auth.controller';
import permission from '../permissions'

const EmployeePermissions = permission.Employee_Permissions;

// create new router
const router = express.Router()

// handle path parameters
router.param('employeeId', employeeCtrl.employeeByID)

/*
  * -------------- User API ------------------
  * For specific documentation, please see /Documentation/index.html
*/

router.route('/api/ent/employees')
  .get(permission.Authorize([]), employeeCtrl.list)
  .post(permission.Authorize([]),employeeCtrl.create);

router.route('/api/ent/employees/:employeeId')
  .get(permission.Authorize([EmployeePermissions.Read]), employeeCtrl.read)
  .put(permission.Authorize([EmployeePermissions.EditContent]),authCtrl.requireOwnership, employeeCtrl.update)
  .delete(permission.Authorize([EmployeePermissions.Delete]), authCtrl.requireOwnership, employeeCtrl.remove);

router.route('/api/ent/employees/:employeeId/avatar')
  .get(permission.Authorize([EmployeePermissions.Read]), employeeCtrl.getProfilePhoto)
  .post(permission.Authorize([EmployeePermissions.EditContent]), authCtrl.requireOwnership,employeeCtrl.uploadProfilePhoto)
  .delete(permission.Authorize([EmployeePermissions.Delete]),authCtrl.requireOwnership,employeeCtrl.removeProfilePhoto);

router.route('/api/ent/employees/:employeeId/password')
  .put(permission.Authorize([EmployeePermissions.ChangePassword]),authCtrl.requireOwnership,employeeCtrl.changePassword);

router.route('/api/ent/employees/:employeeId/role')
  .put(permission.Authorize([EmployeePermissions.ChangeRole]), employeeCtrl.changeRole);

  
export default router
