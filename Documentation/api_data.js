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
    "filename": "_api_doc/_auth_api_doc.js",
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
    "description": "<p>Login to Locker account</p>",
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
        "4xx": [
          {
            "group": "4xx",
            "optional": false,
            "field": "400",
            "description": "<p>Missing username, phone number, email.</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "401",
            "description": "<p>Invalid password</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "404",
            "description": "<p>User not found</p>"
          }
        ],
        "5xx": [
          {
            "group": "5xx",
            "optional": false,
            "field": "500",
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
    "filename": "_api_doc/_auth_api_doc.js",
    "groupTitle": "Auth",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/auth/login"
      }
    ]
  },
  {
    "type": "delete",
    "url": "/api/users/:userId/?access_token=YOUR_ACCESS_TOKEN",
    "title": "Delete User",
    "description": "<p>Permanently removes a user and all their information (i.e. profile photo form S3, any followers/followings)</p>",
    "name": "DeleteApiUsersUserId",
    "group": "User",
    "version": "0.1.0",
    "permission": [
      {
        "name": "OwnershipRequired",
        "title": "Require Ownership",
        "description": "<p>Must own the resource you are requesting</p>"
      },
      {
        "name": "UserEditContent",
        "title": "Require scope \"user:edit_content\"",
        "description": "<p>Assigned to all Users by default</p>"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "Object",
            "optional": false,
            "field": "DeletedUser",
            "description": "<p>The user that has been deleted.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "    HTTP/1.1 200 OK\n {\n    \"permissions\": [\n        \"post:read\",\n        \"post:interact\",\n        \"user:edit_content\",\n        \"user:delete\",\n        \"user:read\"\n    ],\n    \"gender\": \"\",\n    \"about\": \"\",\n    \"following\": [],\n    \"followers\": [],\n    \"_id\": \"5f3dcd97832746181006b1eb\",\n    \"username\": \"JohnDoe\",\n    \"phone_number\": \"000-111-2222\",\n    \"first_name\": \"John\",\n    \"last_name\": \"Doe\",\n    \"email\": \"a@mail.com\",\n    \"createdAt\": \"2020-08-20T01:10:47.626Z\",\n    \"updatedAt\": \"2020-08-20T01:10:47.626Z\",\n    \"__v\": 0\n}",
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
            "field": "500",
            "description": "<p>Unable to remove user</p>"
          }
        ],
        "4xx": [
          {
            "group": "4xx",
            "optional": false,
            "field": "401",
            "description": "<p>Invalid or missing token in Authorization header (Authorization: bearer <token>)</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "403",
            "description": "<p>Unauthorized</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "NotLoggedIn:",
          "content": "HTTP/1.1 401 Unauthorized\n    {\n        \"error\": \"UnauthorizedError: Invalid or missing JWT token.\"\n    }",
          "type": "json"
        },
        {
          "title": "NotOwner:",
          "content": "HTTP/1.1 403 Forbidden\n    {\n        \"error\": \"User is not authorized to access resource\"\n    }",
          "type": "json"
        },
        {
          "title": "BadPermissions:",
          "content": "HTTP/1.1 403 Forbidden\n    {\n        \"error\": \"Insufficient permissions\"\n    }",
          "type": "json"
        }
      ]
    },
    "filename": "_api_doc/_user_api_doc.js",
    "groupTitle": "User",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/users/:userId/?access_token=YOUR_ACCESS_TOKEN"
      }
    ]
  },
  {
    "type": "delete",
    "url": "/api/users/:userId/avatar?access_token=YOUR_ACCESS_TOKEN",
    "title": "Delete Profile Photo",
    "description": "<p>Permanently removes user profile photo</p>",
    "name": "DeleteApiUsersUserIdAvatar",
    "group": "User",
    "version": "0.1.0",
    "permission": [
      {
        "name": "OwnershipRequired",
        "title": "Require Ownership",
        "description": "<p>Must own the resource you are requesting</p>"
      },
      {
        "name": "UserEditContent",
        "title": "Require scope \"user:edit_content\"",
        "description": "<p>Assigned to all Users by default</p>"
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
            "description": "<p>Successfully removed profile photo</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 200 OK\n{\n    \"message\" :  \"Successfully removed profile photo\"\n}",
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
            "field": "404",
            "description": "<p>No profile photo to delete</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "401",
            "description": "<p>Invalid or missing token in Authorization header (Authorization: bearer <token>)</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "403",
            "description": "<p>Unauthorized</p>"
          }
        ],
        "5xx": [
          {
            "group": "5xx",
            "optional": false,
            "field": "503",
            "description": "<p>Unable to remove image from S3 bucket</p>"
          },
          {
            "group": "5xx",
            "optional": false,
            "field": "500",
            "description": "<p>Unable to query DB for user.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "ResourceNotFound:",
          "content": "HTTP/1.1 404 Resource Not Found\n    {\n        \"error\": \"Profile photo not found\"\n    }",
          "type": "json"
        },
        {
          "title": "NotLoggedIn:",
          "content": "HTTP/1.1 401 Unauthorized\n    {\n        \"error\": \"UnauthorizedError: Invalid or missing JWT token.\"\n    }",
          "type": "json"
        },
        {
          "title": "NotOwner:",
          "content": "HTTP/1.1 403 Forbidden\n    {\n        \"error\": \"User is not authorized to access resource\"\n    }",
          "type": "json"
        },
        {
          "title": "BadPermissions:",
          "content": "HTTP/1.1 403 Forbidden\n    {\n        \"error\": \"Insufficient permissions\"\n    }",
          "type": "json"
        }
      ]
    },
    "filename": "_api_doc/_user_api_doc.js",
    "groupTitle": "User",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/users/:userId/avatar?access_token=YOUR_ACCESS_TOKEN"
      }
    ]
  },
  {
    "type": "get",
    "url": "/api/users",
    "title": "List All Users",
    "description": "<p>Fetch a list of Locker users</p>",
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
            "field": "500",
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
    "filename": "_api_doc/_user_api_doc.js",
    "groupTitle": "User",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/users"
      }
    ]
  },
  {
    "type": "get",
    "url": "/api/users/:userId/avatar?access_token=YOUR_ACCESS_TOKEN",
    "title": "Get Profile Photo",
    "description": "<p>Retrieve the profile photo from AWS S3 bucket</p>",
    "name": "GetApiUsersUserIdAvatar",
    "group": "User",
    "version": "0.1.0",
    "permission": [
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
            "type": "Stream",
            "optional": false,
            "field": "Image",
            "description": "<p>The profile photo is streamed in the HTTP response.</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "4xx": [
          {
            "group": "4xx",
            "optional": false,
            "field": "404",
            "description": "<p>Profile not found in S3.</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "401",
            "description": "<p>Invalid or missing token in Authorization header (Authorization: bearer <token>)</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "403",
            "description": "<p>Unauthorized</p>"
          }
        ],
        "5xx": [
          {
            "group": "5xx",
            "optional": false,
            "field": "500",
            "description": "<p>ServerError: Unable to send file, but it exists in S3</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "NotLoggedIn:",
          "content": "HTTP/1.1 401 Unauthorized\n    {\n        \"error\": \"UnauthorizedError: Invalid or missing JWT token.\"\n    }",
          "type": "json"
        },
        {
          "title": "BadPermissions:",
          "content": "HTTP/1.1 403 Forbidden\n    {\n        \"error\": \"Insufficient permissions\"\n    }",
          "type": "json"
        }
      ]
    },
    "filename": "_api_doc/_user_api_doc.js",
    "groupTitle": "User",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/users/:userId/avatar?access_token=YOUR_ACCESS_TOKEN"
      }
    ]
  },
  {
    "type": "get",
    "url": "/api/users/:userId?access_token=YOUR_ACCESS_TOKEN",
    "title": "Get Specific User Info",
    "description": "<p>Retrieve data from a specific user queried by :userId path parameter in URL</p>",
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
            "field": "about",
            "description": "<p>About the user</p>"
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
            "field": "username",
            "description": "<p>Username of user</p>"
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
          "content": "HTTP/1.1 200 OK\n{\n    \"about\" :   \"Hi I am John Doe!\"\n    \"following\": [],\n    \"followers\": [],\n    \"_id\": \"5f3ac37951772102cbb2ce58\",\n    \"username\": \"JohnDoe\",\n    \"first_name\": \"John\",\n    \"last_name\": \"Doe\",\n    \"createdAt\": \"2020-08-17T17:50:49.777Z\",\n    \"updatedAt\": \"2020-08-17T17:50:49.777Z\"\n}",
          "type": "json"
        }
      ]
    },
    "filename": "_api_doc/_user_api_doc.js",
    "groupTitle": "User",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/users/:userId?access_token=YOUR_ACCESS_TOKEN"
      }
    ],
    "error": {
      "fields": {
        "4xx": [
          {
            "group": "4xx",
            "optional": false,
            "field": "401",
            "description": "<p>Invalid or missing token in Authorization header (Authorization: bearer <token>)</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "403",
            "description": "<p>Unauthorized</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "NotLoggedIn:",
          "content": "HTTP/1.1 401 Unauthorized\n    {\n        \"error\": \"UnauthorizedError: Invalid or missing JWT token.\"\n    }",
          "type": "json"
        },
        {
          "title": "BadPermissions:",
          "content": "HTTP/1.1 403 Forbidden\n    {\n        \"error\": \"Insufficient permissions\"\n    }",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "post",
    "url": "/api/users",
    "title": "Sign Up",
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
            "description": "<p>Description of user (Cannot exceed 120 characters)</p>"
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
            "field": "400",
            "description": "<p>Missing required fields, invalid fields, non-unique username/email/phone number, etc.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Invalid username:",
          "content": "HTTP/1.1 400 Internal Server Error\n{\n  \"error\": \"A valid username is required\"\n}",
          "type": "json"
        },
        {
          "title": "Invalid field:",
          "content": "HTTP/1.1 400 Internal Server Error\n    {\n        \"error\": \"Bad request: The following are invalid fields 'bad_key'\"\n    }",
          "type": "json"
        },
        {
          "title": "Non-Unique Constraint:",
          "content": "HTTP/1.1 400 Internal Server Error\n    {\n        \"error\": \"Email already exists\"\n    }",
          "type": "json"
        }
      ]
    },
    "filename": "_api_doc/_user_api_doc.js",
    "groupTitle": "User",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/users"
      }
    ]
  },
  {
    "type": "post",
    "url": "/api/users/:userId/avatar?access_token=YOUR_ACCESS_TOKEN",
    "title": "Update Profile Photo",
    "description": "<p>Updates the user's profile photo by storing it in an AWS S3 bucket.</p>",
    "name": "PostApiUsersUserIdAvatar",
    "group": "User",
    "version": "0.1.0",
    "permission": [
      {
        "name": "OwnershipRequired",
        "title": "Require Ownership",
        "description": "<p>Must own the resource you are requesting</p>"
      },
      {
        "name": "UserEditContent",
        "title": "Require scope \"user:edit_content\"",
        "description": "<p>Assigned to all Users by default</p>"
      }
    ],
    "parameter": {
      "fields": {
        "Form Data": [
          {
            "group": "Form Data",
            "type": "File",
            "optional": false,
            "field": "image",
            "description": "<p>Profile image to upload</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Successfully uploaded user profile photo</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 200 OK\n{\n    \"message\" :  \"Successfully uploaded user profile photo\"\n}",
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
            "field": "400",
            "description": "<p>No file selected</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "422",
            "description": "<p>Not an image file</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "401",
            "description": "<p>Invalid or missing token in Authorization header (Authorization: bearer <token>)</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "403",
            "description": "<p>Unauthorized</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "MissingFile:",
          "content": "HTTP/1.1 400 Bad Request\n    {\n        \"error\": \"Missing file to upload\"\n    }",
          "type": "json"
        },
        {
          "title": "UnprocessableEntity:",
          "content": "HTTP/1.1 422 Unprocessable Entity\n    {\n        \"error\": \"Invalid Mime Type, only JPEG and PNG\"\n    }",
          "type": "json"
        },
        {
          "title": "NotLoggedIn:",
          "content": "HTTP/1.1 401 Unauthorized\n    {\n        \"error\": \"UnauthorizedError: Invalid or missing JWT token.\"\n    }",
          "type": "json"
        },
        {
          "title": "NotOwner:",
          "content": "HTTP/1.1 403 Forbidden\n    {\n        \"error\": \"User is not authorized to access resource\"\n    }",
          "type": "json"
        },
        {
          "title": "BadPermissions:",
          "content": "HTTP/1.1 403 Forbidden\n    {\n        \"error\": \"Insufficient permissions\"\n    }",
          "type": "json"
        }
      ]
    },
    "filename": "_api_doc/_user_api_doc.js",
    "groupTitle": "User",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/users/:userId/avatar?access_token=YOUR_ACCESS_TOKEN"
      }
    ]
  },
  {
    "type": "put",
    "url": "/api/users/:userId/?access_token=YOUR_ACCESS_TOKEN",
    "title": "Update Profile",
    "description": "<p>Update profile of a specific user and returns the updated profile to that user.</p>",
    "name": "PutApiUsersUserId",
    "group": "User",
    "version": "0.1.0",
    "permission": [
      {
        "name": "OwnershipRequired",
        "title": "Require Ownership",
        "description": "<p>Must own the resource you are requesting</p>"
      },
      {
        "name": "UserEditContent",
        "title": "Require scope \"user:edit_content\"",
        "description": "<p>Assigned to all Users by default</p>"
      }
    ],
    "parameter": {
      "fields": {
        "Request body": [
          {
            "group": "Request body",
            "type": "String",
            "optional": true,
            "field": "username",
            "description": "<p>Username (unique, alphanumeric (underscore allowed), at most 32 characters)</p>"
          },
          {
            "group": "Request body",
            "type": "String",
            "optional": true,
            "field": "email",
            "description": "<p>Email unique, valid email address)</p>"
          },
          {
            "group": "Request body",
            "type": "String",
            "optional": true,
            "field": "phone_number",
            "description": "<p>Phone number (unique, valid phone number)</p>"
          },
          {
            "group": "Request body",
            "type": "String",
            "optional": true,
            "field": "first_name",
            "description": "<p>First name</p>"
          },
          {
            "group": "Request body",
            "type": "String",
            "optional": true,
            "field": "last_name",
            "description": "<p>Last name</p>"
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
            "description": "<p>Description of user (Cannot exceed 120 characters) * @apiSuccess (200) {Object} DeletedUser The user that has been deleted.</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Response (example):",
          "content": "    HTTP/1.1 200 OK\n{\n    \"permissions\": [\n        \"post:read\",\n        \"post:interact\",\n        \"user:edit_content\",\n        \"user:delete\",\n        \"user:read\"\n    ],\n    \"gender\": \"\",\n    \"about\": \"\",\n    \"following\": [],\n    \"followers\": [],\n    \"_id\": \"5f3dd0cf4a3c392049ed1ed8\",\n    \"username\": \"AnUpdatedUsername\",\n    \"phone_number\": \"000-111-2222\",\n    \"first_name\": \"John\",\n    \"last_name\": \"Doe\",\n    \"email\": \"a@mail.com\",\n    \"createdAt\": \"2020-08-20T01:24:31.076Z\",\n    \"updatedAt\": \"2020-08-20T01:25:08.140Z\",\n    \"__v\": 0\n}",
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
            "field": "422",
            "description": "<p>Invalid fields were provided.</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "401",
            "description": "<p>Invalid or missing token in Authorization header (Authorization: bearer <token>)</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "403",
            "description": "<p>Unauthorized</p>"
          }
        ],
        "5xx": [
          {
            "group": "5xx",
            "optional": false,
            "field": "500",
            "description": "<p>Unable to query DB and find user to update.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "UnprocessableEntity: ",
          "content": "HTTP/1.1 422 Unprocessable Entity\n    {\n        \"error\": \"(Bad request) The following are invalid fields...\"\n    }",
          "type": "json"
        },
        {
          "title": "NotLoggedIn:",
          "content": "HTTP/1.1 401 Unauthorized\n    {\n        \"error\": \"UnauthorizedError: Invalid or missing JWT token.\"\n    }",
          "type": "json"
        },
        {
          "title": "NotOwner:",
          "content": "HTTP/1.1 403 Forbidden\n    {\n        \"error\": \"User is not authorized to access resource\"\n    }",
          "type": "json"
        },
        {
          "title": "BadPermissions:",
          "content": "HTTP/1.1 403 Forbidden\n    {\n        \"error\": \"Insufficient permissions\"\n    }",
          "type": "json"
        }
      ]
    },
    "filename": "_api_doc/_user_api_doc.js",
    "groupTitle": "User",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/users/:userId/?access_token=YOUR_ACCESS_TOKEN"
      }
    ]
  }
] });