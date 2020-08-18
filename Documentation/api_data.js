define({ "api": [
  {
    "type": "get",
    "url": "/auth/logout",
    "title": "Logout",
    "description": "<p>Removes JWT token from Cookies to log out.</p>",
    "name": "GetAuthLogout",
    "group": "Auth",
    "version": "0.1.0",
    "permission": [
      {
        "name": "none"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>&quot;Logged out&quot;</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 200 OK\n{\n        message: \"Logged out\"\n}",
          "type": "json"
        }
      ]
    },
    "filename": "server/routes/_auth_api_doc.js",
    "groupTitle": "Auth",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/auth/logout"
      }
    ]
  },
  {
    "type": "post",
    "url": "/auth/login",
    "title": "Login",
    "description": "<p>Log into an existing Locker account</p>",
    "name": "PostAuthLogin",
    "group": "Auth",
    "version": "0.1.0",
    "permission": [
      {
        "name": "none"
      }
    ],
    "parameter": {
      "fields": {
        "Request body": [
          {
            "group": "Request body",
            "type": "String",
            "optional": false,
            "field": "login",
            "description": "<p><code>Required</code> Username, email address, or phone number</p>"
          },
          {
            "group": "Request body",
            "type": "String",
            "optional": false,
            "field": "password",
            "description": "<p><code>Required</code> Password</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n \"login\"    : \"JohnDoe\",\n \"password\" : \"JohnDoeP@ssw@rd123#\"\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>JWT token</p>"
          },
          {
            "group": "200",
            "type": "Object",
            "optional": false,
            "field": "user",
            "description": "<p>User object</p>"
          },
          {
            "group": "200",
            "type": "ObjectId",
            "optional": false,
            "field": "user._id",
            "description": "<p>MongoDB ID of user</p>"
          },
          {
            "group": "200",
            "type": "String",
            "optional": false,
            "field": "user.username",
            "description": "<p>Username of user</p>"
          },
          {
            "group": "200",
            "type": "String",
            "optional": false,
            "field": "user.email",
            "description": "<p>Email of user</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 200 OK\n{\n  \"token\": \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZjNhYjg4MDg1NmQyNTYxZWZlNzRmYTEiLCJwZXJtaXNzaW9ucyI6WyJwb3N0OnJlYWQiLCJwb3N0OmludGVyYWN0IiwidXNlcjplZGl0X2NvbnRlbnQiLCJ1c2VyOmRlbGV0ZSIsInVzZXI6cmVhZCJdLCJpYXQiOjE1OTc2ODM4NTZ9.gh2c-KHWUamR87k9kUR7yBDyL4NB3LROxrAEDnrDvLo\",\n  \"user\": {\n      \"_id\": \"5f3ab880856d2561efe74fa1\",\n      \"username\": \"JohnDoe\",\n      \"email\" : \"johndoe@gmail.com\",\n  }\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "MissingLoginInfo",
            "description": "<p>Missing username, phone number, email.</p>"
          },
          {
            "group": "400",
            "optional": false,
            "field": "MissingPassword",
            "description": "<p>Missing password</p>"
          }
        ],
        "401": [
          {
            "group": "401",
            "optional": false,
            "field": "InvalidPassword",
            "description": "<p>Invalid password</p>"
          }
        ],
        "404": [
          {
            "group": "404",
            "optional": false,
            "field": "UserNotFound",
            "description": "<p>User not found</p>"
          }
        ],
        "500": [
          {
            "group": "500",
            "optional": false,
            "field": "ServerError",
            "description": "<p>Server unable to login user</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "MissingLoginInfo:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"Missing username, phone number, or email\"\n}",
          "type": "json"
        },
        {
          "title": "MissingPassword:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"Missing password\"\n}",
          "type": "json"
        },
        {
          "title": "InvalidPassword:",
          "content": "HTTP/1.1 401 Unauthorized\n{\n  \"error\": \"Invalid password\"\n}",
          "type": "json"
        },
        {
          "title": "UserNotFound:",
          "content": "HTTP/1.1 404 Not Found\n{\n  \"error\": \"User not found\"\n}",
          "type": "json"
        },
        {
          "title": "ServerError:",
          "content": "HTTP/1.1 500 Internal Server Error\n{\n  \"error\": \"Server unable to login user\"\n}",
          "type": "json"
        }
      ]
    },
    "filename": "server/routes/_auth_api_doc.js",
    "groupTitle": "Auth",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/auth/login"
      }
    ]
  },
  {
    "type": "get",
    "url": "/api/users",
    "title": "List all users",
    "description": "<p>List all Locker users</p>",
    "name": "GetApiUsers",
    "group": "User",
    "version": "0.1.0",
    "permission": [
      {
        "name": "none"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "Object[]",
            "optional": false,
            "field": "profiles",
            "description": "<p>List of all user profiles</p>"
          },
          {
            "group": "200",
            "type": "ObjectId",
            "optional": false,
            "field": "profiles._id",
            "description": "<p>MongoDB ID</p>"
          },
          {
            "group": "200",
            "type": "String",
            "optional": false,
            "field": "profiles.username",
            "description": "<p>Username</p>"
          },
          {
            "group": "200",
            "type": "Date",
            "optional": false,
            "field": "profile.updatedAt",
            "description": "<p>Timestamp of last update to user profile</p>"
          },
          {
            "group": "200",
            "type": "Date",
            "optional": false,
            "field": "profile.createdAt",
            "description": "<p>Timestamp of when user was created</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 200 OK\n[\n {\n   \"_id\": \"5f34821b0c46f63b28831230\",\n   \"username\": \"userA\",\n   \"updated\": \"2020-08-12T23:58:19.944Z\",\n   \"created\": \"2020-08-12T23:58:19.944Z\"\n },\n :\n {\n   \"_id\": \"5f34821c0c46f63b28831231\",\n   \"username\": \"userB\",\n   \"updated\": \"2020-08-12T23:58:20.137Z\",\n   \"created\": \"2020-08-12T23:58:20.137Z\"\n },\n]",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "5xx": [
          {
            "group": "5xx",
            "optional": false,
            "field": "InternalServerError",
            "description": "<p>Unable to retrieve users from database (e.g. unable to connect or overloaded)</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 500 Internal Server Error\n{\n  \"error\": \"Timeout of 2000ms exceeded\"\n}",
          "type": "json"
        }
      ]
    },
    "filename": "server/routes/_user_api_doc.js",
    "groupTitle": "User",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/users"
      }
    ]
  },
  {
    "type": "get",
    "url": "/api/users/:userId",
    "title": "Read specific user's data",
    "description": "<p>Retrieve data from a specific user queried by ObjectID</p>",
    "name": "GetApiUsersbyID",
    "group": "User",
    "version": "0.1.0",
    "permission": [
      {
        "name": "LoginRequired",
        "title": "Require login",
        "description": ""
      },
      {
        "name": "UserRead",
        "title": "Require scope \"user:read\"",
        "description": "<p>Assigned to all Users by default</p>"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "ObjectId",
            "optional": false,
            "field": "_id",
            "description": "<p>MongoDB ID</p>"
          },
          {
            "group": "200",
            "type": "String",
            "optional": false,
            "field": "first_name",
            "description": "<p>First name of user</p>"
          },
          {
            "group": "200",
            "type": "String",
            "optional": false,
            "field": "last_name",
            "description": "<p>Last name of user</p>"
          },
          {
            "group": "200",
            "type": "String",
            "optional": false,
            "field": "phone_number",
            "description": "<p>Phone number of user</p>"
          },
          {
            "group": "200",
            "type": "Object[]",
            "optional": false,
            "field": "following",
            "description": "<p>Array of who user followers</p>"
          },
          {
            "group": "200",
            "type": "ObjectId",
            "optional": false,
            "field": "following._id",
            "description": "<p>MongoDB ID of user following</p>"
          },
          {
            "group": "200",
            "type": "String",
            "optional": false,
            "field": "following._username",
            "description": "<p>Username of user following</p>"
          },
          {
            "group": "200",
            "type": "Object[]",
            "optional": false,
            "field": "followers",
            "description": "<p>Array of followers of user</p>"
          },
          {
            "group": "200",
            "type": "ObjectId",
            "optional": false,
            "field": "followers._id",
            "description": "<p>MongoDB ID of follower</p>"
          },
          {
            "group": "200",
            "type": "String",
            "optional": false,
            "field": "followers._username",
            "description": "<p>Username of follower</p>"
          },
          {
            "group": "200",
            "type": "Date",
            "optional": false,
            "field": "updatedAt",
            "description": "<p>Timestamp of last update to user profile</p>"
          },
          {
            "group": "200",
            "type": "Date",
            "optional": false,
            "field": "createdAt",
            "description": "<p>Timestamp of when user was created</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 200 OK\n{\n    \"following\": [],\n    \"followers\": [],\n    \"_id\": \"5f3ac37951772102cbb2ce58\",\n    \"username\": \"JohnDoe\",\n    \"first_name\": \"John\",\n    \"last_name\": \"Doe\",\n    \"createdAt\": \"2020-08-17T17:50:49.777Z\",\n    \"updatedAt\": \"2020-08-17T17:50:49.777Z\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "401": [
          {
            "group": "401",
            "optional": false,
            "field": "NotAuthorized",
            "description": "<p>Invalid or missing token in Authorization header (Authorization: bearer <token>)</p>"
          }
        ],
        "403": [
          {
            "group": "403",
            "optional": false,
            "field": "Forbidden",
            "description": "<p>Insufficient permissions.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 401 Unauthorized\n    {\n        \"error\": \"UnauthorizedError: Invalid or missing JWT token.\"\n    }",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 403 Forbidden\n    {\n        \"error\": \"Insufficient permissions\"\n    }",
          "type": "json"
        }
      ]
    },
    "filename": "server/routes/_user_api_doc.js",
    "groupTitle": "User",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/users/:userId"
      }
    ],
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Bearer <code>JWT token</code></p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/api/users",
    "title": "Create new user",
    "description": "<p>Sign in a new user to Locker</p>",
    "name": "PostApiUsers",
    "group": "User",
    "version": "0.1.0",
    "permission": [
      {
        "name": "none"
      }
    ],
    "parameter": {
      "fields": {
        "Request body": [
          {
            "group": "Request body",
            "type": "String",
            "optional": false,
            "field": "username",
            "description": "<p><code>Required</code> Username (unique, alphanumeric (underscore allowed), at most 32 characters)</p>"
          },
          {
            "group": "Request body",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p><code>Required</code> Email unique, valid email address)</p>"
          },
          {
            "group": "Request body",
            "type": "String",
            "optional": false,
            "field": "phone_number",
            "description": "<p><code>Required</code> Phone number (unique, valid phone number)</p>"
          },
          {
            "group": "Request body",
            "type": "String",
            "optional": false,
            "field": "first_name",
            "description": "<p><code>Required</code> First name</p>"
          },
          {
            "group": "Request body",
            "type": "String",
            "optional": false,
            "field": "last_name",
            "description": "<p><code>Required</code> Last name</p>"
          },
          {
            "group": "Request body",
            "type": "String",
            "optional": false,
            "field": "password",
            "description": "<p><code>Required</code> Password (at least 7 characters; at least 1 number; at least one of @, !, #, $, % or ^; at least 1 uppercase letter)</p>"
          },
          {
            "group": "Request body",
            "type": "Date",
            "optional": true,
            "field": "date_of_birth",
            "description": "<p>Date of birth</p>"
          },
          {
            "group": "Request body",
            "type": "String",
            "optional": true,
            "field": "gender",
            "description": "<p>Gender</p>"
          },
          {
            "group": "Request body",
            "type": "String",
            "optional": true,
            "field": "about",
            "description": "<p>Description of user</p>"
          },
          {
            "group": "Request body",
            "type": "File",
            "optional": true,
            "field": "profile_photo",
            "description": "<p>Profile image</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n \"first_name\"    : \"John\",\n \"last_name\"     : \"Doe\",\n \"username\"      : \"JohnDoe\",\n \"email\"         : \"John.Doe@gmail.com\",\n \"phone_number\"  : \"502-673-3231\",\n \"password\"      : \"JohnDoeP@ssw@rd123#\"\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "String",
            "optional": false,
            "field": "SignedUp",
            "description": "<p>Successfully signed up!</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 200 OK\n {\n   \"message\": \"Successfully signed up!\"\n }",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "4xx": [
          {
            "group": "4xx",
            "optional": false,
            "field": "BadRequest",
            "description": "<p>Missing required fields, invalid fields, non-unique username/email/phone number, etc.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 400 Internal Server Error\n{\n  \"error\": \"A valid username is required\"\n}",
          "type": "json"
        }
      ]
    },
    "filename": "server/routes/_user_api_doc.js",
    "groupTitle": "User",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/users"
      }
    ]
  }
] });
