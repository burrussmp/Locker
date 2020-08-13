# REST API Documentation

## User (Customers)

### No Authentication

* [List All Users](user/list.md) : `GET /api/users/`

* [Create New User](user/create.md) : `POST /api/users/`

* [Login](auth/login.md) : `POST /auth/logout`

* [Logout](auth/logout.md) : `GET /auth/logout`

# Developer Guide

## Steps to Update the Back-End

1. Determine new test cases
    - Update `/test/<model>.test.js` file
2. Update the Model (`/server/model`)
    - Validate new fields
3. Update the Routes (`/server/routes`)
    - Check to make sure a route can't be re-used
4. Run `npm test` to see if all tests pass
5. Update API Documentation

## Collections

The collections in the MongoDB

1. User
2. Organization
3. Products
4. Orders

## Authentication

Authentication is achieved using JSON web tokens (JWT). For example, upon login, the user will send the username and password to the server. The server will verify that this is correct and then sign a JSON object using the secret and the HMAC SHA256 algorithm.

It is up to the client to store this token and to send it in subsequent requests using the header 'Authorization' with content 'Bearer [token]'.

## Authorization

Authorization is also achieved using the JSON web tokens. In the encrypted credentials will be a field called 'role'. This will determine whether or not the person is authorized to perform the action. The id of the person will also be included when it is required to authorize a specific individual (e.g. changing their profile.)

## Permissions, scope, and roles

Permissions and scopes are what are used to authorize various API calls. The JWT token that is included in the credentials will include the permissions and scope of those permissions. Roles will encapsulate the various permissions and scope. For details of all permissions, see `/server/permissions.js` and for the roles see `/server/roles`.

If you navigate to `/server/permissions.js`, you'll see the entire list of scopes that specify the permissions in the format `permission = resource:scope` where `resource` refers to the collection that can be modified according to the scope.

Note: By default, every API call has no permissions. These are only granted after a successful login. The `User` and `Organization` collection have a field called role that encapsulates all the permissions

