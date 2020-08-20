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

// all permissions associated with Post collection
const Post_Permissions = {
    Create: 'post:create', // Create Post
    Read: "post:read", // Read Post
    Delete: "post:delete", // Delete Post
    Edit: "post:edit", // Edit any field of Post document
    EditContent: "post:edit_content", // Edit only editable content (like caption, etc.)
    Interact: "post:interact", // includes comment, liking, loving, etc.
    AddOwner: "post:add_owner", // add owner to post
    RemoveOwner: "post:remove_owner", // remove owner to post
};

// all permissions associated with User
const User_Permissions = {
    Create: 'user:create', // Create User
    ListAll: "user:list_all", // List all users
    Delete: "user:delete", // Delete user
    Read: "user:read", // Read information from user
    EditContent: "user:edit_content", // Edit only editable content (like caption, etc.)
    AddPermission: "user:add_permission", // able to add permission to a user,
    RemovePermission: "user:remove_permission", // able to remove permission from user
    ChangePassword: "user:change_password" // able to change password
};

const MutableMongooseFields = {
    User: [
        'first_name',
        'phone_number',
        'last_name',
        'username',
        'gender',
        'email',
        'date_of_birth',
        'about',
        'password',
        'old_password'
    ]
}

const get_permission_array = (type) => {
    let post_permissions,user_permissions;
    if (type == 'user'){
        post_permissions = [
            Post_Permissions.Read,
            Post_Permissions.Interact,
        ]
        user_permissions = [
            User_Permissions.EditContent,
            User_Permissions.Delete,
            User_Permissions.Read,
            User_Permissions.ChangePassword
        ]
    }
    return [...post_permissions,
            ...user_permissions];        
};

const User_Role = {
    role: 'user',
    permissions: get_permission_array('user')
};

// express middleware to handle permissions
const Authorize = (req,res,next) => {
    let required_permissions = [];
    let path = req.route.path;
    let method = req.method;
    let require_login = true;
    switch(path){
        case '/api/users': // public
            require_login = false;
            break;
        case '/auth/login': // public
            require_login = false;
            break;
        case '/auth/logout': // public
            require_login = false;
            break;
        case `/api/users/:userId`:
            switch(method){
                case 'GET':
                    required_permissions.push(User_Permissions.Read);
                    break;
                case 'PUT':
                    required_permissions.push(User_Permissions.EditContent)
                    break;
                case 'DELETE':
                    required_permissions.push(User_Permissions.Delete)
                    break;
            }
            break;
        case `/api/users/:userId/avatar`:
            switch(method){
                case 'GET':
                    required_permissions.push(User_Permissions.Read);
                    break;
                case 'POST':
                    required_permissions.push(User_Permissions.EditContent)
                    break;
                case 'DELETE':
                    required_permissions.push(User_Permissions.EditContent);
                    break;
            }
            break;
        case `/api/users/:userId/password`:
            required_permissions.push(User_Permissions.ChangePassword);
            break;
        case `/api/users/:userId/follow`:
                switch(method){
                    case 'GET':
                        required_permissions.push(User_Permissions.Read);
                        break;
                    case 'PUT':
                        required_permissions.push(User_Permissions.EditContent)
                        break;
                    case 'DELETE':
                        required_permissions.push(User_Permissions.EditContent);
                        break;
                }
    }
    res.locals.require_login = require_login;
    res.locals.permissions = required_permissions;
    authCtrl.checkLogin(req,res,next)
}

export default {
    User_Role,
    Authorize,
};