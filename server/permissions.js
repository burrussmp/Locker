/* eslint-disable max-len */
'use strict';
/*
* Assumptions
    - All permissions are disallowed by default
    - Each permission grants a privilege
    - Certain privileges are reserved for admins (like ownership)
    - Business logic field contains necessary business logic
* Public Content
    - User profile
    - Organization profile
*/

import authCtrl from './controllers/auth.controller';
import fetch from 'node-fetch';
import config from '../config/config';
import RBAC from './models/rbac.model';
import fs from 'fs';
import FormData from 'form-data';
import dbErrorHandler from './services/dbErrorHandler';

// all permissions associated with Post collection
const Post_Permissions = {
  Create: 'post:create', // Create Post
  Read: 'post:read', // Read Post
  Delete: 'post:delete', // Delete Post
  EditContent: 'post:edit', // Edit only editable content (like caption, etc.)
  Interact: 'post:interact', // includes comment, liking, loving, etc.
};

// all permissions associated with Comment collection
const Comment_Permissions = {
  Create: 'comment:create', // Create comment
  Read: 'comment:read', // Read comment
  Delete: 'comment:delete', // Delete comment
  EditContent: 'comment:edit', // Edit only editable content
  Interact: 'comment:interact', // includes liking
};

// all permissions associated with User
const User_Permissions = {
  Create: 'user:create', // Create User
  Delete: 'user:delete', // Delete user
  Read: 'user:read', // Read information from user
  EditContent: 'user:edit', // Edit only editable content (like caption, etc.)
  ChangePassword: 'user:change_password', // able to change password
};

// all permissions associated with User
const Employee_Permissions = {
  Create: 'employee:create', // Create User
  Delete: 'employee:delete', // Delete user
  Read: 'employee:read', // Read information from user
  EditContent: 'employee:edit', // Edit only editable content (like caption, etc.)
  ChangeRole: 'employee:change_role', // change the role of an employee
  ChangeOrganizationRole: 'employee:change_organization_role', // able to change the role of someone in an organization
};

// all permissions associated with an Organization
const Organization_Permissions = {
  Create: 'organization:create',
  Delete: 'organization:delete',
  Read: 'organization:read',
  EditContent: 'organization:edit',
  EditAccessList: 'organization:edit_access_list',
  AddEmployee: 'organization:add_employee',
  DeleteEmployee: 'organization:delete_employee',
};

const get_permission_array = (type) => {
  let assignedPermissions = [];
  if (type == 'user' || type == 'supervisor' || type == 'admin' || type == 'employee') {
    assignedPermissions = assignedPermissions.concat([
      Post_Permissions.Read,
      Post_Permissions.Interact,
      Post_Permissions.Create,
      Post_Permissions.EditContent,
      Post_Permissions.Delete,
      User_Permissions.EditContent,
      User_Permissions.Delete,
      User_Permissions.Read,
      User_Permissions.ChangePassword,
      Comment_Permissions.Create,
      Comment_Permissions.EditContent,
      Comment_Permissions.Read,
      Comment_Permissions.Delete,
      Comment_Permissions.Interact,
    ]);
  }
  if (type == 'employee') {
    assignedPermissions = assignedPermissions.concat([
      Employee_Permissions.EditContent,
      Employee_Permissions.Delete,
      Employee_Permissions.Read,
    ]);
  }
  if (type == 'supervisor' || type == 'admin') {
    assignedPermissions = assignedPermissions.concat([
      Organization_Permissions.EditAccessList,
      Organization_Permissions.Read,
      Organization_Permissions.EditContent,
      Organization_Permissions.AddEmployee,
      Organization_Permissions.DeleteEmployee,
      Employee_Permissions.Create,
      Employee_Permissions.EditContent,
      Employee_Permissions.Delete,
      Employee_Permissions.Read,
      Employee_Permissions.ChangeOrganizationRole,
    ]);
  }
  if (type == 'admin') {
    assignedPermissions = assignedPermissions.concat([
      Organization_Permissions.Create,
      Organization_Permissions.Delete,
      Employee_Permissions.ChangeRole,
    ]);
  }
  return assignedPermissions;
};

const Authorize = (permissions, requireLogin = true) => {
  return (req, res, next) => {
    res.locals.require_login = requireLogin;
    res.locals.permissions = permissions;
    authCtrl.checkLogin(req, res, next);
  };
};

const setUpRBAC = async () => {
  const User_Role = {
    role: 'user',
    level: 50,
    permissions: get_permission_array('user'),
  };
  try {
    await (new RBAC(User_Role)).save();
  } catch (err) {
    // console.log(dbErrorHandler.getErrorMessage(err));
  }

  const Admin_Role = {
    role: 'admin',
    level: 0,
    permissions: get_permission_array('admin'),
  };

  try {
    await (new RBAC(Admin_Role)).save();
  } catch (err) {
    // console.log(dbErrorHandler.getErrorMessage(err));
  }

  const Supervisor_Role = {
    role: 'supervisor',
    level: 5,
    permissions: get_permission_array('supervisor'),
  };

  try {
    await (new RBAC(Supervisor_Role)).save();
  } catch (err) {
    // console.log(dbErrorHandler.getErrorMessage(err));
  }

  const Employee_Role = {
    role: 'employee',
    level: 10,
    permissions: get_permission_array('employee'),
  };
  try {
    await (new RBAC(Employee_Role)).save();
  } catch (err) {
    // console.log(dbErrorHandler.getErrorMessage(err));
  }

  const NA_Role = {
    role: 'none',
    level: 100000,
    permissions: [],
  };

  try {
    await (new RBAC(NA_Role)).save();
  } catch (err) {
    // console.log(dbErrorHandler.getErrorMessage(err));
  }

  const admin = {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    role_type: 'admin',
  };
  try {
    await fetch(`http://${config.address}:${config.port}/api/ent/employees?access_token=${process.env.ADMIN_SECRET}`, {
      'method': 'POST',
      'headers': {
        'Content-Type': 'application/json',
      },
      'body': JSON.stringify(admin),
    }).then((res) => res.json()).then(async (res) => {
      const accessToken = res.access_token;
      const employeeId = res._id;
      const form = new FormData();
      form.append('media', fs.createReadStream(process.cwd() + '/images/logo.png'));
      form.append('name', 'Locker Company');
      form.append('url', 'https://locker.com');
      form.append('description', 'Locker Company');
      await fetch(`http://${config.address}:${config.port}/api/ent/organizations?access_token=${accessToken}`, {
        method: 'POST',
        body: form,
      }).then((res) => res.json()).then(async (org) => {
        const organizationId = org._id;
        await fetch(`http://${config.address}:${config.port}/api/ent/organizations/${organizationId}/employees/?access_token=${accessToken}`, {
          'method': 'POST',
          'headers': {
            'Content-Type': 'application/json',
          },
          'body': JSON.stringify({
            employeeId: employeeId,
          }),
        });
      });
    });
  } catch (err) {
    console.log(dbErrorHandler.getErrorMessage(err));
  }
};

export default {
  User_Permissions,
  Post_Permissions,
  Organization_Permissions,
  Comment_Permissions,
  Employee_Permissions,
  Authorize,
  setUpRBAC,
  get_permission_array,
};
