"use strict";
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
import RBAC from './models/rbac.model';

// all permissions associated with Post collection
const Post_Permissions = {
    Create: 'post:create', // Create Post
    Read: "post:read", // Read Post
    Delete: "post:delete", // Delete Post
    EditContent: "post:edit", // Edit only editable content (like caption, etc.)
    Interact: "post:interact", // includes comment, liking, loving, etc.
};

// all permissions associated with Comment collection
const Comment_Permissions = {
    Create: 'comment:create', // Create comment
    Read: "comment:read", // Read comment
    Delete: "comment:delete", // Delete comment
    EditContent: "comment:edit", // Edit only editable content 
    Interact: "comment:interact", // includes liking
};

// all permissions associated with User
const User_Permissions = {
    Create: 'user:create', // Create User
    Delete: "user:delete", // Delete user
    Read: "user:read", // Read information from user
    EditContent: "user:edit", // Edit only editable content (like caption, etc.)
    ChangePassword: "user:change_password" // able to change password
};

// all permissions associated with an Organization
const Organization_Permissions = {
    Create: 'organization:create',
    Delete: 'organization:delete',
    Read: 'organization:read',
    EditContent: 'organization:edit',
    EditAccessList: 'organization:edit_access_list', 
}

const get_permission_array = (type) => {
    let post_permissions,user_permissions,comment_permissions,organization_permissions;
    if (type == 'user'){
        post_permissions = [
            Post_Permissions.Read,
            Post_Permissions.Interact,
            Post_Permissions.Create,
            Post_Permissions.EditContent,
            Post_Permissions.Delete
        ]
        user_permissions = [
            User_Permissions.EditContent,
            User_Permissions.Delete,
            User_Permissions.Read,
            User_Permissions.ChangePassword
        ]
        comment_permissions = [
            Comment_Permissions.Create,
            Comment_Permissions.EditContent,
            Comment_Permissions.Read,
            Comment_Permissions.Delete,
            Comment_Permissions.Interact,
        ]
        organization_permissions = [];
    } else if (type == 'admin'){
        post_permissions = [
            Post_Permissions.Read,
            Post_Permissions.Interact,
            Post_Permissions.Create,
            Post_Permissions.EditContent,
            Post_Permissions.Delete
        ]
        user_permissions = [
            User_Permissions.EditContent,
            User_Permissions.Delete,
            User_Permissions.Read,
            User_Permissions.ChangePassword
        ]
        comment_permissions = [
            Comment_Permissions.Create,
            Comment_Permissions.EditContent,
            Comment_Permissions.Read,
            Comment_Permissions.Delete,
            Comment_Permissions.Interact,
        ]
        organization_permissions = [
            Organization_Permissions.Create,
            Organization_Permissions.EditAccessList,
            Organization_Permissions.Read,
            Organization_Permissions.Delete,
            Organization_Permissions.EditContent,   
        ]
    } else if (type == 'supervisor'){
        post_permissions = [
            Post_Permissions.Read,
            Post_Permissions.Interact,
            Post_Permissions.Create,
            Post_Permissions.EditContent,
            Post_Permissions.Delete
        ]
        user_permissions = [
            User_Permissions.EditContent,
            User_Permissions.Delete,
            User_Permissions.Read,
            User_Permissions.ChangePassword
        ]
        comment_permissions = [
            Comment_Permissions.Create,
            Comment_Permissions.EditContent,
            Comment_Permissions.Read,
            Comment_Permissions.Delete,
            Comment_Permissions.Interact,
        ]
        organization_permissions = [
            Organization_Permissions.EditAccessList,
            Organization_Permissions.Read,
            Organization_Permissions.Delete,
            Organization_Permissions.EditContent,   
        ]
    }

    return [...post_permissions,
            ...user_permissions,
            ...comment_permissions,
            ...organization_permissions];
    
};

const Authorize = (permissions, requireLogin = true) => {
    return (req, res, next) => {
        res.locals.require_login = requireLogin;
        res.locals.permissions = permissions;
        authCtrl.checkLogin(req, res, next)
    };
}

const setUpRBAC = async () => {
    const User_Role = {
        role: 'user',
        level: 50,
        permissions: get_permission_array('user')
    };
    await (new RBAC(User_Role)).save()
    
    const Admin_Role = {
        role: 'admin',
        level: 0,
        permissions: get_permission_array('admin')
    };
    await (new RBAC(Admin_Role)).save()

    const Supervisor_Role = {
        role: 'supervisor',
        level: 0,
        permissions: get_permission_array('supervisor')
    };
    await (new RBAC(Supervisor_Role)).save()

    const NA_Role = {
        role: 'none',
        level: 100000,
        permissions: []
    };
    await (new RBAC(NA_Role)).save()
}

export default {
    User_Permissions,
    Post_Permissions,
    Organization_Permissions,
    Comment_Permissions,
    Authorize,
    setUpRBAC,
    get_permission_array,
};