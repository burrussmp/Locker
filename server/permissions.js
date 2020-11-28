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

import fetch from 'node-fetch';
import config from '../config/config';
import RBAC from './models/rbac.model';
import fs from 'fs';
import FormData from 'form-data';
import dbErrorHandler from './services/dbErrorHandler';

// all permissions associated with Post collection
const PostPermissions = {
  Create: 'post:create', // Create Post
  Read: 'post:read', // Read Post
  Delete: 'post:delete', // Delete Post
  EditContent: 'post:edit', // Edit only editable content (like caption, etc.)
  Interact: 'post:interact', // includes comment, liking, loving, etc.
};

// all permissions associated with Comment collection
const CommentPermissions = {
  Create: 'comment:create', // Create comment
  Read: 'comment:read', // Read comment
  Delete: 'comment:delete', // Delete comment
  EditContent: 'comment:edit', // Edit only editable content
  Interact: 'comment:interact', // includes liking
};

// all permissions associated with User
const UserPermissions = {
  Create: 'user:create', // Create User
  Delete: 'user:delete', // Delete user
  Read: 'user:read', // Read information from user
  EditContent: 'user:edit', // Edit only editable content (like caption, etc.)
  ChangePassword: 'user:change_password', // able to change password
};

// all permissions associated with User
const EmployeePermissions = {
  Create: 'employee:create', // Create User
  Delete: 'employee:delete', // Delete user
  Read: 'employee:read', // Read information from user
  EditContent: 'employee:edit', // Edit only editable content (like caption, etc.)
  ChangeRole: 'employee:change_role', // change the role of an employee
};

// all permissions associated with an Organization
const OrganizationPermissions = {
  Create: 'organization:create',
  Delete: 'organization:delete',
  Read: 'organization:read',
  EditContent: 'organization:edit',
  EditAccessList: 'organization:edit_access_list',
  AddEmployee: 'organization:add_employee',
  DeleteEmployee: 'organization:delete_employee',
};

// all permissions associated with a Product
const ProductPermissions = {
  Create: 'product:create',
  Delete: 'product:delete',
  Read: 'product:read',
  EditContent: 'product:edit',
};

const getPermissionArray = (type) => {
  let assignedPermissions = [];
  if (type == 'user' || type == 'supervisor' || type == 'admin' || type == 'employee') {
    assignedPermissions = assignedPermissions.concat([
      PostPermissions.Read,
      PostPermissions.Interact,
      PostPermissions.Create,
      PostPermissions.EditContent,
      PostPermissions.Delete,
      UserPermissions.EditContent,
      UserPermissions.Delete,
      UserPermissions.Read,
      UserPermissions.ChangePassword,
      CommentPermissions.Create,
      CommentPermissions.EditContent,
      CommentPermissions.Read,
      CommentPermissions.Delete,
      CommentPermissions.Interact,
    ]);
  }
  if (type == 'employee') {
    assignedPermissions = assignedPermissions.concat([
      EmployeePermissions.EditContent,
      EmployeePermissions.Delete,
      EmployeePermissions.Read,
      ProductPermissions.Create,
      ProductPermissions.Delete,
      ProductPermissions.Read,
      ProductPermissions.EditContent,
    ]);
  }
  if (type == 'supervisor' || type == 'admin') {
    assignedPermissions = assignedPermissions.concat([
      OrganizationPermissions.EditAccessList,
      OrganizationPermissions.Read,
      OrganizationPermissions.EditContent,
      OrganizationPermissions.AddEmployee,
      OrganizationPermissions.DeleteEmployee,
      EmployeePermissions.Create,
      EmployeePermissions.EditContent,
      EmployeePermissions.Delete,
      EmployeePermissions.Read,
      EmployeePermissions.ChangeRole,
      ProductPermissions.Create,
      ProductPermissions.Delete,
      ProductPermissions.Read,
      ProductPermissions.EditContent,
    ]);
  }
  if (type == 'admin') {
    assignedPermissions = assignedPermissions.concat([
      OrganizationPermissions.Create,
      OrganizationPermissions.Delete,
    ]);
  }
  return assignedPermissions;
};

const setUpRBAC = async () => {
  const UserRole = {
    role: 'user',
    level: 50,
    permissions: getPermissionArray('user'),
  };
  try {
    await (new RBAC(UserRole)).save();
  } catch (err) {
    // console.log(dbErrorHandler.getErrorMessage(err));
  }

  const adminRole = {
    role: 'admin',
    level: 0,
    permissions: getPermissionArray('admin'),
  };

  try {
    await (new RBAC(adminRole)).save();
  } catch (err) {
    // console.log(dbErrorHandler.getErrorMessage(err));
  }

  const supervisorRole = {
    role: 'supervisor',
    level: 5,
    permissions: getPermissionArray('supervisor'),
  };

  try {
    await (new RBAC(supervisorRole)).save();
  } catch (err) {
    // console.log(dbErrorHandler.getErrorMessage(err));
  }

  const employeeRole = {
    role: 'employee',
    level: 10,
    permissions: getPermissionArray('employee'),
  };
  try {
    await (new RBAC(employeeRole)).save();
  } catch (err) {
    // console.log(dbErrorHandler.getErrorMessage(err));
  }

  const NARole = {
    role: 'none',
    level: 100000,
    permissions: [],
  };

  try {
    await (new RBAC(NARole)).save();
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
  UserPermissions,
  PostPermissions,
  OrganizationPermissions,
  CommentPermissions,
  EmployeePermissions,
  ProductPermissions,
  setUpRBAC,
  getPermissionArray,
};
