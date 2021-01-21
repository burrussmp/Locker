import fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';

import RBAC from './models/rbac.model';

import SecretManagerServices from '@server/services/secret.manager';

import config from '@config/config';
import ErrorHandler from './services/error.handler';

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

// all permissions associated with a Collection
const CollectionPermissions = {
  Create: 'collection:create',
  Delete: 'collection:delete',
  Read: 'collection:read',
  EditContent: 'collection:edit',
};

// all permissions associated with a Locker
const LockerPermissions = {
  Create: 'locker:create',
  Delete: 'locker:delete',
  Read: 'locker:read',
  EditContent: 'locker:edit',
}

// all permissions associated with a Locker Collection
const LockerCollectionPermissions = {
  Create: 'locker_collection:create',
  Delete: 'locker_collection:delete',
  Read: 'locker_collection:read',
  EditContent: 'locker_collection:edit',
}

const extend = (...arrayOfPermissions) => {
  const allPermissions = [].concat(...arrayOfPermissions);
  return [...new Set(allPermissions)];
};

const getPermissionArray = (type) => {
  const permissions = {};
  permissions['user'] = extend([
    UserPermissions.EditContent,
    UserPermissions.Delete,
    UserPermissions.Read,
    UserPermissions.ChangePassword,
    CommentPermissions.Create,
    CommentPermissions.EditContent,
    CommentPermissions.Read,
    CommentPermissions.Delete,
    CommentPermissions.Interact,
    PostPermissions.Read,
    PostPermissions.Interact,
    ProductPermissions.Read,
    CollectionPermissions.Read,
    LockerPermissions.Read,
    LockerPermissions.EditContent,
    LockerCollectionPermissions.Create,
    LockerCollectionPermissions.Read,
    LockerCollectionPermissions.EditContent,
    LockerCollectionPermissions.Delete
  ]);
  permissions['employee'] = extend([
    UserPermissions.Read,
    CommentPermissions.Read,
    PostPermissions.Read,
    PostPermissions.Create,
    PostPermissions.EditContent,
    PostPermissions.Delete,
    ProductPermissions.Read,
    ProductPermissions.Create,
    ProductPermissions.Delete,
    ProductPermissions.EditContent,
    EmployeePermissions.EditContent,
    EmployeePermissions.Read,
    CollectionPermissions.Read,
    CollectionPermissions.Create,
    CollectionPermissions.EditContent,
    CollectionPermissions.Delete,
    LockerPermissions.Read,
  ]);
  permissions['supervisor'] = extend(permissions['employee'], [
    EmployeePermissions.Create,
    EmployeePermissions.Delete,
    EmployeePermissions.ChangeRole,
    OrganizationPermissions.EditAccessList,
    OrganizationPermissions.Read,
    OrganizationPermissions.EditContent,
    OrganizationPermissions.AddEmployee,
    OrganizationPermissions.DeleteEmployee,
  ]);
  permissions['admin'] = extend(permissions['user'], permissions['supervisor'], [
    OrganizationPermissions.Create,
    OrganizationPermissions.Delete,
    LockerPermissions.Create,
    LockerPermissions.Delete,
  ]);
  return permissions[type];
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
    // console.log(ErrorHandler.getErrorMessage(err));
  }

  const adminRole = {
    role: 'admin',
    level: 0,
    permissions: getPermissionArray('admin'),
  };

  try {
    await (new RBAC(adminRole)).save();
  } catch (err) {
    // console.log(ErrorHandler.getErrorMessage(err));
  }

  const supervisorRole = {
    role: 'supervisor',
    level: 5,
    permissions: getPermissionArray('supervisor'),
  };

  try {
    await (new RBAC(supervisorRole)).save();
  } catch (err) {
    // console.log(ErrorHandler.getErrorMessage(err));
  }

  const employeeRole = {
    role: 'employee',
    level: 10,
    permissions: getPermissionArray('employee'),
  };
  try {
    await (new RBAC(employeeRole)).save();
  } catch (err) {
    // console.log(ErrorHandler.getErrorMessage(err));
  }

  const NARole = {
    role: 'none',
    level: 100000,
    permissions: [],
  };

  try {
    await (new RBAC(NARole)).save();
  } catch (err) {
    // console.log(ErrorHandler.getErrorMessage(err));
  }
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    const secrets = await SecretManagerServices.getSecrets();
    process.env.ADMIN_EMAIL = secrets['admin_email'];
    process.env.ADMIN_PASSWORD = secrets['admin_password'];
  }
  const admin = {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    role_type: 'admin',
  };

  try {
    await fetch(`http://${config.address}:${config.port}/api/employees?access_token=${process.env.ADMIN_SECRET}`, {
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
      await fetch(`http://${config.address}:${config.port}/api/organizations?access_token=${accessToken}`, {
        method: 'POST',
        body: form,
      }).then((res) => res.json()).then(async (org) => {
        const organizationId = org._id;
        await fetch(`http://${config.address}:${config.port}/api/organizations/${organizationId}/employees/?access_token=${accessToken}`, {
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
    console.log(ErrorHandler.getErrorMessage(err));
  }
};

export default {
  UserPermissions,
  PostPermissions,
  OrganizationPermissions,
  CommentPermissions,
  EmployeePermissions,
  ProductPermissions,
  CollectionPermissions,
  LockerPermissions,
  LockerCollectionPermissions,
  setUpRBAC,
  getPermissionArray,
};
