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

// all permissions associated with Comment collection
const Comment_Permissions = {
    Create: 'comment:create', // Create comment
    Read: "comment:read", // Read comment
    Delete: "comment:delete", // Delete comment
    EditContent: "comment:edit_content", // Edit only editable content 
    Interact: "comment:interact", // includes liking
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


const get_permission_array = (type) => {
    let post_permissions,user_permissions,comment_permissions;
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
    }
    return [...post_permissions,
            ...user_permissions,
            ...comment_permissions];        
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
        // Auth API
        case '/auth/login':
            require_login = false;
            break;
        case '/auth/logout':
            require_login = false;
            break;
        case '/auth/verify_token':
            require_login = false;
            break;
        case '/auth/forgot_password':
            require_login = false;
            break
        case '/auth/confirm_forgot_password':
            require_login = false;
            break
        // User API
        case '/api/users':
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
            break
        case `/api/posts`:
            switch(method){
                case 'GET':
                    required_permissions.push(Post_Permissions.Read);
                    break;
                case 'POST':
                    required_permissions.push(Post_Permissions.Create)
                    break;
            }
        break
        // Post API 
        case `/api/posts`:
            switch(method){
                case 'GET':
                    required_permissions.push(Post_Permissions.Read);
                    break;
                case 'POST':
                    required_permissions.push(Post_Permissions.Create)
                    break;
            }
        break
        case `/api/posts/:postId`:
            switch(method){
                case 'GET':
                    required_permissions.push(Post_Permissions.Read);
                    break;
                case 'DELETE':
                    required_permissions.push(Post_Permissions.Delete)
                    break;
                case 'PUT':
                    required_permissions.push(Post_Permissions.EditContent)
                    break;
            }
        break
        case `/api/:postId/comments`:
            switch(method){
                case 'GET':
                    required_permissions.push(Post_Permissions.Read);
                    required_permissions.push(Comment_Permissions.Read);
                    break;
                case 'POST':
                    required_permissions.push(Post_Permissions.EditContent);
                    required_permissions.push(Comment_Permissions.Create)
                    break;
            }
        break
        case `/api/comments/:commentId`:
            switch(method){
                case 'GET':
                    required_permissions.push(Post_Permissions.Read);
                    required_permissions.push(Comment_Permissions.Read);
                    break;
                case 'DELETE':
                    required_permissions.push(Post_Permissions.EditContent);
                    required_permissions.push(Comment_Permissions.Delete)
                    break;
            }
        break
        case `/api/posts/:postId/reaction`:
            switch(method){
                case 'GET':
                    required_permissions.push(Post_Permissions.Read);
                    break;
                case 'DELETE':
                    required_permissions.push(Post_Permissions.EditContent);
                    required_permissions.push(Post_Permissions.Interact)
                    break;
                case 'PUT':
                    required_permissions.push(Post_Permissions.EditContent);
                    required_permissions.push(Post_Permissions.Interact)
                    break;
            }
        break
        // Comment API
        case `/api/:commentId/replies`:
            switch(method){
                case 'GET':
                    required_permissions.push(Post_Permissions.Read);
                    required_permissions.push(Comment_Permissions.Read);
                    break;
                case 'POST':
                    required_permissions.push(Post_Permissions.EditContent);
                    required_permissions.push(Comment_Permissions.EditContent)
                    break;
            }
        break
        case `/api/:commentId/likes`:
            switch(method){
                case 'PUT':
                    required_permissions.push(Post_Permissions.EditContent);
                    required_permissions.push(Comment_Permissions.EditContent);
                    break;
                case 'DELETE':
                    required_permissions.push(Post_Permissions.EditContent);
                    required_permissions.push(Comment_Permissions.EditContent);
                    break;
            }
        break
        case `/api/:commentId/replies/:replyId`:
            switch(method){
                case 'GET':
                    required_permissions.push(Post_Permissions.Read);
                    required_permissions.push(Comment_Permissions.Read);
                    break;
                case 'PUT':
                    required_permissions.push(Post_Permissions.EditContent);
                    required_permissions.push(Comment_Permissions.EditContent)
                    break;
                case 'DELETE':
                    required_permissions.push(Post_Permissions.EditContent);
                    required_permissions.push(Comment_Permissions.Delete)
                    break;
            }
        break
        case `/api/:commentId/replies/:replyId/likes`:
            switch(method){
                case 'PUT':
                    required_permissions.push(Post_Permissions.EditContent);
                    required_permissions.push(Comment_Permissions.Interact)
                    break;
                case 'DELETE':
                    required_permissions.push(Post_Permissions.EditContent);
                    required_permissions.push(Comment_Permissions.Interact)
                    break;
            }
        break
        case `/api/search/users/`:
            switch(method){
                case 'POST':
                    required_permissions.push(User_Permissions.Read);
                    required_permissions.push(User_Permissions.ListAll)
                    break;
            }
        break
    }
    res.locals.require_login = require_login;
    res.locals.permissions = required_permissions;
    authCtrl.checkLogin(req,res,next)
}

export default {
    User_Role,
    Authorize,
    get_permission_array
};