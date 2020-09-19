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
          "content": "HTTP/1.1 200 OK\n{\n    \"message\": \"Logged out\"\n}",
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
    "type": "head",
    "url": "/auth/verify_token?token=<YOUR_TOKEN>",
    "title": "Verify JWT Token",
    "description": "<p>Verifies token query parameter</p>",
    "name": "HeadAuthVerifyToken",
    "group": "Auth",
    "version": "0.1.0",
    "permission": [
      {
        "name": "none"
      }
    ],
    "success": {
      "fields": {
        "2xx": [
          {
            "group": "2xx",
            "optional": false,
            "field": "200",
            "description": "<p>Token is verified</p>"
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
            "field": "401",
            "description": "<p>Token is not verified</p>"
          }
        ]
      }
    },
    "filename": "_api_doc/_auth_api_doc.js",
    "groupTitle": "Auth",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/auth/verify_token?token=<YOUR_TOKEN>"
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
            "field": "access_token",
            "description": "<p>JWT access token</p>"
          },
          {
            "group": "200",
            "type": "String",
            "optional": false,
            "field": "id_token",
            "description": "<p>JWT ID token</p>"
          },
          {
            "group": "200",
            "type": "String",
            "optional": false,
            "field": "refresh_token",
            "description": "<p>JWT refresh token</p>"
          },
          {
            "group": "200",
            "type": "ObjectId",
            "optional": false,
            "field": "_id",
            "description": "<p>MongoDB ID of user</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "    HTTP/1.1 200 OK\n{\n    \"access_token\": \"eyJraWQiOiJSOGNuYnFxM2YzV0V6Zk94NVRuRE1NYU5CdUZsU1llU0lJVFZNclRRSTJJPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJkNjM5NGM2NS1kZDRiLTQ4MjUtYmRmZi01YWU1ZDNlMGI5MWYiLCJldmVudF9pZCI6ImExNzU4ZTFjLTllZWQtNDE4Mi1iZDM1LTJmNzk4MGM5YjE2NyIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE2MDAxNzkzMTYsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC51cy1lYXN0LTEuYW1hem9uYXdzLmNvbVwvdXMtZWFzdC0xX3hyU2xrRDhXdSIsImV4cCI6MTYwMDE4MjkxNiwiaWF0IjoxNjAwMTc5MzE2LCJqdGkiOiIyZGZmNzY4OS1iZDIxLTRlNTUtODVjMS1jM2U0MDEyNDNjMmEiLCJjbGllbnRfaWQiOiI2bmZpNjAyMmhwNDZqZm8yNmJrMGE4M3JjdCIsInVzZXJuYW1lIjoiZGJjYTY4NDUtZDQwMC00ZTM3LWJlNzgtM2JlYjdlYjdhNjNhIn0.ay4VyBuN1F2kWFsMRxJ2_GtMPOKQjFUkmuyjX8Z2JbSO2RixjYsRmnLCeRakI7kXfobHxgLKfYGKUJ8TQBxJuaQrAO2dvN_zjpaq3UF4y-zUZPvzzU0jeY4RlgcPgJErU6OduGNjaSWPLHvVah3jicrBvkPCGDQdaXHXziwrTLaiuHAoIfYtuHV4dNhPxTH0o_GQqMhKFTCy06KJXP96kJSTUTVcsFMGaHR2Pr0WvL9Cya7UHrGugNX4zQ7aRMaxcuKUF6GgmFl6ixuLxOzLkXxoAMOnImqI3R7sBrgOzbQVME08HqHxjb_j4sTPYIM1MAdKir6vy2UH1enHEBLMfw\",\n    \"id_token\": \"eyJraWQiOiIyeUJmYzhjWjIwVVJrcWdKZ1R4MktvRW5UT3JYTElWYmNwdkltVlVpVXJrPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJkNjM5NGM2NS1kZDRiLTQ4MjUtYmRmZi01YWU1ZDNlMGI5MWYiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tXC91cy1lYXN0LTFfeHJTbGtEOFd1IiwicGhvbmVfbnVtYmVyX3ZlcmlmaWVkIjp0cnVlLCJjb2duaXRvOnVzZXJuYW1lIjoiZGJjYTY4NDUtZDQwMC00ZTM3LWJlNzgtM2JlYjdlYjdhNjNhIiwicHJlZmVycmVkX3VzZXJuYW1lIjoibWF0dGhldzQiLCJhdWQiOiI2bmZpNjAyMmhwNDZqZm8yNmJrMGE4M3JjdCIsImV2ZW50X2lkIjoiYTE3NThlMWMtOWVlZC00MTgyLWJkMzUtMmY3OTgwYzliMTY3IiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE2MDAxNzkzMTYsInBob25lX251bWJlciI6IisxNTAyNjg5MTgyMyIsImV4cCI6MTYwMDE4MjkxNiwiaWF0IjoxNjAwMTc5MzE2LCJlbWFpbCI6Im5ld191c2VyM0BnbWFpbC5jb20ifQ.uiQOxEKXjv2zsu89yQUAnWjIJCixFWK4Y_AIZcV3--U3T3OooLnWn9n-2dfNKbH8TscNyN1nfjI6z8FPTRpx0ysu8qcCsUUI6rCC83GDQD1NeDmyrg9yMCmVEnn3fs-jNgQGhjRKK3fA3_VC7JmMrSFQii-rDOnPgY7YhSKNvqRsnI8R3QWUw47A0MyrGPrT4Wq-mZ-IF5i9flLj7_pWDZl0DQlOjTbjRR-xB_CAcfElGog_-ZogXWChXvT0OHHy43DL4r03nipcLms03OWtbtJInbK4pljo1zZqgXxEHL01xuvkQSW356GE1P8aMUIqDHmu-maYkQsS885lAPuu1w\",\n    \"refresh_token\": \"eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ.WpNRmabYPIcOgF3UsUHyPRwsSIqvaahnLAHFErJgiOpzcGvsQBeA9cDhcGPrMSRAV3wpXxvjbJbvIKmsiA1EDBRkEcQC2wSpjPQDEe6syHI2PMKJX2aQhE_WgH574KQEhpjdHKDox4wH6LrOxjuGCiaZtAIPzavp5aOch8M3Y4Otata_VEC2ZNcUo0fDaMuObEVFMQfHSr_UgVjyzft-fcjZ2L06kbkNdmsUXn-YZ0jfn-rV4x_YBuhUmr_JuhXbbpEkfLWA5VbzeYJ2nvPDr_CeI-SFfhgCoD__TViN7NiLl1kNYXJ5dN41jkpp-5-R3noJQA3cglItYdeG8eNR-A.wfiYYQC4Ipz6VIxu.EEk89oAYxpxF3E-PoOG-fwtB7bReJcrV_lPUk0j4j4JDGGluGIpTBB5amn6-W6AFphwY_EcrPRngrB48cPO5FIAj919MrHrufPsL0rsHaUMgd1n5WZe8Ra8e9F5dlWA8u35UfYgVO-GqF_DaIMb3wL2wPGA-dewt9PQzOYXhAbvAEb2649qHJ5Kni5sd1X3cOE29gMLoeN7bTPRAVytsXH3XEfAmxk4gaD2ju3ooCiyVGlPNO_WbG5le7uNL4xjR-lw7n6fgjcX33vNt9zfmz5mmpW9kV-YeBXF5N8Q_LLAbBfMFgXTJYZSE-Q4m7dUncMo4c-GIWnUXmq3Cw6GFtwwsl8n7Oda1gMGnj7LFr7bLMS2HiHctrGQ_5Uwz20vGIk5_kiO6u0Vhy6XOfocqsQ2A3qrJgYycVGiOaJjsgrZliTu0tW7RyRkihqCWIE9BMU-YB3hTm7pynDiuqpZ-cfGD4pmPkrKDvYv2U64N7ZfoioQjo2Kbma1RX1eYPqVJDWJXATWCTppYddRlla7UneIt8zmjFDhwH1tijR0sl3r1kmYzJbpqJ-YwQLGWjNy0M_40Fy4fEs---EZ1KKXE22UvwUZ9fzRQZ6aF2SCkdZCE18CpdVgCT-xtwRsTlmzxxmbqAIaVrsL92Rz4mCYpA-QVWb6UhlqgNbAmzg21ui8QNgajfL1GgVTkHxlqVJV15o7JvPvp8S7csNk9nnUms2Vg2YOhAbBMXWFXbxNzvQfxF4Ah4HdeDAbnaFEkk4iPYhQgehAkUxc_WZdWt03aQ9V3y2b6Y6Ar6j96ZQZ7YCPW_aubUYwPhM9Y39lT8p0jI1w47_NSDgQxJ9XT80NOIEH91sZOEN66qrFFdEFAi-naKAhUc0-V6w98vaojQu_g3pEgsLJmOL8zsNRVpxXAxiDzgMFzGRsc3tWhQVZ0QSBjH2Go0kAcYELx3eSrRK0fjwIUnYXRsJZn8JyhDflrxOaZo8TgMTJx8BHQkbQbCY9z2P1_W1CrNipewQaS5RloTTTFZCkTJCUsq_h99706wU6p5k1pNtgzOFULA1MDatm3nWOg1yKtdsxn89HZ_Vks1waUdWqIJwH2Yg3O3-SnMYnQMoxtb5a8ZjNmv9F49MMRreNHUxWp427vmV1Pk75BK_EoExUo5X6onjuEu9DgVgqQlCygdDsBlmVNnI0PNrLjz8ojxCY9A7df_VTZjDN1HpPlDq271VKCQGsi-51A9Y2xJ43ZU2taiSbZ64IbcTRmAFJ0pZJYWgN9vNXoRxzwha8KS58DmeVfNAg4TjQWL9-QdScFU0nnLJfIzHVMkZ1O1KBpFZJBOmdmAQ.BsLVaQWZUM32Oq6XVhh_Vw\",\n    \"_id\": \"5f60cc7422add441148a35ea\"\n}",
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
            "description": "<p>Missing username or password (either username or password are incorrect)</p>"
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
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"Username required\"\n}",
          "type": "json"
        },
        {
          "title": "MissingPassword:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"Missing password\"\n}",
          "type": "json"
        },
        {
          "title": "InvalidPassword:",
          "content": "HTTP/1.1 401 Unauthorized\n{\n  \"error\": \"Incorrect username or password.\"\n}",
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
    "url": "/api/:commentId/likes",
    "title": "Unlike",
    "description": "<p>Unlike a comment</p>",
    "name": "DeleteApiCommentIdLikes",
    "group": "Comment",
    "version": "0.1.0",
    "permission": [
      {
        "name": "LoginRequired",
        "title": "Require login",
        "description": ""
      },
      {
        "name": "PostEditContent",
        "title": "Require scope \"post:edit_content\"",
        "description": "<p>Assigned to all Users by default</p>"
      },
      {
        "name": "CommentEditContent",
        "title": "Require scope \"comment:edit_content\"",
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
            "description": "<p>&quot;Successfully unliked a comment&quot;</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "  HTTP/1.1 200 OK\n{\n  \"message\" : \"Successfully unliked a comment\"\n}",
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
            "description": "<p>Bad Request: Text not included</p>"
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
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "404",
            "description": "<p>Comment not found</p>"
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
        },
        {
          "title": "CommentNotFound:",
          "content": "HTTP/1.1 404 Resource Not Found\n    {\n        \"error\": \"Comment not found\"\n    }",
          "type": "json"
        }
      ]
    },
    "filename": "_api_doc/_comment_api_doc.js",
    "groupTitle": "Comment",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/:commentId/likes"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
          }
        ]
      }
    }
  },
  {
    "type": "delete",
    "url": "/api/comments/:commentId",
    "title": "Delete Comment",
    "description": "<p>Delete a specific comment</p>",
    "name": "DeleteApiCommentsCommentID",
    "group": "Comment",
    "version": "0.1.0",
    "permission": [
      {
        "name": "LoginRequired",
        "title": "Require login",
        "description": ""
      },
      {
        "name": "OwnershipRequired",
        "title": "Require Ownership",
        "description": "<p>Must own the resource you are requesting</p>"
      },
      {
        "name": "PostEditContent",
        "title": "Require scope \"post:edit_content\"",
        "description": "<p>Assigned to all Users by default</p>"
      },
      {
        "name": "CommentDelete",
        "title": "Require scope \"comment:delete\"",
        "description": "<p>Assigned to all Users by default</p>"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "ObjectID",
            "optional": false,
            "field": "ID",
            "description": "<p>The ID of the deleted comment</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 200 OK\n  {\n    \"_id\": \"5f41f6056bb02a7b13f269e9\"\n  }",
          "type": "json"
        }
      ]
    },
    "filename": "_api_doc/_comment_api_doc.js",
    "groupTitle": "Comment",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/comments/:commentId"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
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
            "field": "401",
            "description": "<p>Invalid or missing token in Authorization header (Authorization: bearer <token>)</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "403",
            "description": "<p>Unauthorized</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "404",
            "description": "<p>Comment not found</p>"
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
        },
        {
          "title": "CommentNotFound:",
          "content": "HTTP/1.1 404 Resource Not Found\n    {\n        \"error\": \"Comment not found\"\n    }",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "get",
    "url": "/api/:commentId/replies",
    "title": "List Replies",
    "description": "<p>For the provided comment, list all the replies</p>",
    "name": "GetApiCommentIdReplies",
    "group": "Comment",
    "version": "0.1.0",
    "permission": [
      {
        "name": "LoginRequired",
        "title": "Require login",
        "description": ""
      },
      {
        "name": "PostRead",
        "title": "Require scope \"post:read\"",
        "description": "<p>Assigned to all Users by default</p>"
      },
      {
        "name": "CommentRead",
        "title": "Require scope \"comment:read\"",
        "description": "<p>Assigned to all Users by default</p>"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "Object[]",
            "optional": false,
            "field": "data",
            "description": "<p>A list of all the replies</p>"
          },
          {
            "group": "200",
            "type": "String",
            "optional": false,
            "field": "data.text",
            "description": "<p>The reply text</p>"
          },
          {
            "group": "200",
            "type": "ObjectID",
            "optional": false,
            "field": "data.postedBy",
            "description": "<p>The ID of the replier</p>"
          },
          {
            "group": "200",
            "type": "Date",
            "optional": false,
            "field": "data.createdAt",
            "description": "<p>The timestamp the reply was posted</p>"
          },
          {
            "group": "200",
            "type": "Number",
            "optional": false,
            "field": "data.likes",
            "description": "<p>Number of likes</p>"
          },
          {
            "group": "200",
            "type": "Boolean",
            "optional": false,
            "field": "data.liked",
            "description": "<p>Whether or not the requester liked this response or not</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "    HTTP/1.1 200 OK\n[\n  {\n    text: \"This is a new reply\",\n    postedBy: 5f3ff3c98edf7e37fc3a5810,\n    createdAt: 2020-08-21T16:18:17.617Z,\n    likes: 0,\n    liked: false\n  }\n]\n          ✓ Correctly posts reply\n[\n  {\n    text: \"This is a new reply\",\n    postedBy: 5f3ff3c98edf7e37fc3a581d,\n    createdAt: 2020-08-21T16:18:17.678Z,\n    likes: 0,\n    liked: false\n  }\n]",
          "type": "json"
        }
      ]
    },
    "filename": "_api_doc/_comment_api_doc.js",
    "groupTitle": "Comment",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/:commentId/replies"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
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
            "field": "401",
            "description": "<p>Invalid or missing token in Authorization header (Authorization: bearer <token>)</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "403",
            "description": "<p>Unauthorized</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "404",
            "description": "<p>Comment not found</p>"
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
        },
        {
          "title": "CommentNotFound:",
          "content": "HTTP/1.1 404 Resource Not Found\n    {\n        \"error\": \"Comment not found\"\n    }",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "get",
    "url": "/api/comments/:commentId",
    "title": "Get Specific Comment",
    "description": "<p>Retrieve a specific comment</p>",
    "name": "GetApiCommentsCommentID",
    "group": "Comment",
    "version": "0.1.0",
    "permission": [
      {
        "name": "LoginRequired",
        "title": "Require login",
        "description": ""
      },
      {
        "name": "PostRead",
        "title": "Require scope \"post:read\"",
        "description": "<p>Assigned to all Users by default</p>"
      },
      {
        "name": "CommentRead",
        "title": "Require scope \"comment:read\"",
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
            "field": "Comment",
            "description": "<p>See below for details</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 200 OK\n    {\n      \"_id\": \"5f41f6056bb02a7b13f269e9\",\n      \"text\": \"Does it come in other colors?\",\n      \"postedBy\": \"5f41f5b16bb02a7b13f269e2\",\n      \"createdAt\": \"2020-08-23T04:52:21.125Z\",\n      \"likes\": 0,\n      \"liked\": false\n    }",
          "type": "json"
        }
      ]
    },
    "filename": "_api_doc/_comment_api_doc.js",
    "groupTitle": "Comment",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/comments/:commentId"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
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
            "field": "401",
            "description": "<p>Invalid or missing token in Authorization header (Authorization: bearer <token>)</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "403",
            "description": "<p>Unauthorized</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "404",
            "description": "<p>Comment not found</p>"
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
        },
        {
          "title": "CommentNotFound:",
          "content": "HTTP/1.1 404 Resource Not Found\n    {\n        \"error\": \"Comment not found\"\n    }",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "post",
    "url": "/api/:postId/comments",
    "title": "Create a Comment",
    "description": "<p>Comment on a post</p>",
    "name": "PostApiPostIdComments",
    "group": "Comment",
    "version": "0.1.0",
    "permission": [
      {
        "name": "LoginRequired",
        "title": "Require login",
        "description": ""
      },
      {
        "name": "PostEditContent",
        "title": "Require scope \"post:edit_content\"",
        "description": "<p>Assigned to all Users by default</p>"
      },
      {
        "name": "CommentEditContent",
        "title": "Require scope \"comment:edit_content\"",
        "description": "<p>Assigned to all Users by default</p>"
      }
    ],
    "parameter": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "String",
            "optional": false,
            "field": "text",
            "description": "<p>Comment text</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "ObjectID",
            "optional": false,
            "field": "_id",
            "description": "<p>The ID of the newly created comment</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "  HTTP/1.1 200 OK\n{\n  \"_id\" : \"5f3ff3c98edf7e37fc3a581d\"\n}",
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
            "description": "<p>Bad Request: Text not included, all whitespace, or too long (MAX: 300 characters)</p>"
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
    "filename": "_api_doc/_comment_api_doc.js",
    "groupTitle": "Comment",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/:postId/comments"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
          }
        ]
      }
    }
  },
  {
    "type": "put",
    "url": "/api/:commentId/likes",
    "title": "Like",
    "description": "<p>Like a comment</p>",
    "name": "PutApiCommentIdLikes",
    "group": "Comment",
    "version": "0.1.0",
    "permission": [
      {
        "name": "LoginRequired",
        "title": "Require login",
        "description": ""
      },
      {
        "name": "PostEditContent",
        "title": "Require scope \"post:edit_content\"",
        "description": "<p>Assigned to all Users by default</p>"
      },
      {
        "name": "CommentEditContent",
        "title": "Require scope \"comment:edit_content\"",
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
            "description": "<p>&quot;Successfully liked a comment&quot;</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "  HTTP/1.1 200 OK\n{\n  \"message\" : \"Successfully liked a comment\"\n}",
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
            "description": "<p>Bad Request: Text not included</p>"
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
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "404",
            "description": "<p>Comment not found</p>"
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
        },
        {
          "title": "CommentNotFound:",
          "content": "HTTP/1.1 404 Resource Not Found\n    {\n        \"error\": \"Comment not found\"\n    }",
          "type": "json"
        }
      ]
    },
    "filename": "_api_doc/_comment_api_doc.js",
    "groupTitle": "Comment",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/:commentId/likes"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
          }
        ]
      }
    }
  },
  {
    "type": "get",
    "url": "/api/media/:key",
    "title": "Get Media from S3",
    "description": "<p>Edit one of your posts. The :key path parameter is the file identifier in the S3 bucket</p>",
    "name": "GetMediaKey",
    "group": "Miscellaneous",
    "version": "0.1.0",
    "permission": [
      {
        "name": "LoginRequired",
        "title": "Require login",
        "description": ""
      },
      {
        "name": "none"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "Stream",
            "optional": false,
            "field": "media",
            "description": "<p>The response object is a stream of the media that has been retrieved.</p>"
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
            "description": "<p>Media not found</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "500",
            "description": "<p>Server Error</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "401",
            "description": "<p>Invalid or missing token in Authorization header (Authorization: bearer <token>)</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "NotLoggedIn:",
          "content": "HTTP/1.1 401 Unauthorized\n    {\n        \"error\": \"UnauthorizedError: Invalid or missing JWT token.\"\n    }",
          "type": "json"
        }
      ]
    },
    "filename": "_api_doc/_miscellaneous_api.js",
    "groupTitle": "Miscellaneous",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/media/:key"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
          }
        ]
      }
    }
  },
  {
    "type": "delete",
    "url": "/api/posts/:postId/reaction",
    "title": "Remove Reaction",
    "description": "<p>Delete your reaction</p>",
    "version": "0.1.0",
    "name": "DeleteAPIPostsPostIdReaction",
    "group": "Post",
    "permission": [
      {
        "name": "LoginRequired",
        "title": "Require login",
        "description": ""
      },
      {
        "name": "PostEditContent",
        "title": "Require scope \"post:edit_content\"",
        "description": "<p>Assigned to all Users by default</p>"
      },
      {
        "name": "PostInteract",
        "title": "Require scope \"post:interact\"",
        "description": "<p>Assigned to all Users by default</p>"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "ObjectID",
            "optional": false,
            "field": "_id",
            "description": "<p>The ID of the post</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 200 OK\n    {\n        \"id\": \"5f400fb18b012a65ef46044b\",\n    }",
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
            "description": "<p>Attempted to remove a reaction you have not made</p>"
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
          "title": "NoReaction: ",
          "content": "HTTP/1.1 404 Resource Not Found\n   {\n       \"error\":  \"You have not reacted, so there is no reaction to delete\"\n   }",
          "type": "json"
        },
        {
          "title": "NotLoggedIn:",
          "content": "HTTP/1.1 401 Unauthorized\n    {\n        \"error\": \"UnauthorizedError: Invalid or missing JWT token.\"\n    }",
          "type": "json"
        },
        {
          "title": "BadPermissions:",
          "content": "HTTP/1.1 403 Forbidden\n    {\n        \"error\": \"Insufficient permissions\"\n    }",
          "type": "json"
        },
        {
          "title": "PostNotFound:",
          "content": "HTTP/1.1 404 Resource Not Found\n    {\n        \"error\": \"Post not found\"\n    }",
          "type": "json"
        }
      ]
    },
    "filename": "_api_doc/_reactions_api_doc.js",
    "groupTitle": "Post",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/posts/:postId/reaction"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
          }
        ]
      }
    }
  },
  {
    "type": "delete",
    "url": "/api/posts/:postId",
    "title": "Delete Post",
    "description": "<p>Delete one of your posts</p>",
    "name": "DeleteApiPostsPostID",
    "group": "Post",
    "version": "0.1.0",
    "permission": [
      {
        "name": "LoginRequired",
        "title": "Require login",
        "description": ""
      },
      {
        "name": "OwnershipRequired",
        "title": "Require Ownership",
        "description": "<p>Must own the resource you are requesting</p>"
      },
      {
        "name": "PostDelete",
        "title": "Require scope \"post:delete\"",
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
            "field": "DeletedPost",
            "description": "<p>See the example response for format</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 200 OK\n  {\n      \"caption\": \"Let's put this caption\",\n      \"comments\": [],\n      \"tags\": [\n          \"tag\",\n          \"tag\",\n          \"tag\",\n          \"tag\",\n          \"tag\",\n          \"tag\",\n          \"tag\"\n      ],\n      \"_id\": \"5f41ea00c025ae611618988c\",\n      \"type\": \"ContentPost\",\n      \"content\": \"5f41ea00c025ae611618988b\",\n      \"postedBy\": \"5f41e9f1c025ae6116189888\",\n      \"reactions\": [],\n      \"createdAt\": \"2020-08-23T04:01:04.988Z\",\n      \"updatedAt\": \"2020-08-23T04:01:04.988Z\",\n      \"__v\": 0\n  }",
          "type": "json"
        }
      ]
    },
    "filename": "_api_doc/_post_api_doc.js",
    "groupTitle": "Post",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/posts/:postId"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
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
            "field": "401",
            "description": "<p>Invalid or missing token in Authorization header (Authorization: bearer <token>)</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "403",
            "description": "<p>Unauthorized</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "404",
            "description": "<p>Post not found</p>"
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
        },
        {
          "title": "PostNotFound:",
          "content": "HTTP/1.1 404 Resource Not Found\n    {\n        \"error\": \"Post not found\"\n    }",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "get",
    "url": "/api/posts/:postId/reaction",
    "title": "Get Reactions of Post",
    "description": "<p>See aggregate view of all the reactions of the post</p>",
    "version": "0.1.0",
    "name": "GetAPIPostsPostIdReaction",
    "group": "Post",
    "permission": [
      {
        "name": "LoginRequired",
        "title": "Require login",
        "description": ""
      },
      {
        "name": "PostRead",
        "title": "Require scope \"post:read\"",
        "description": "<p>Assigned to all Users by default</p>"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "Number",
            "optional": false,
            "field": "like",
            "description": "<p>The number of likes</p>"
          },
          {
            "group": "200",
            "type": "Number",
            "optional": false,
            "field": "love",
            "description": "<p>The number of loves</p>"
          },
          {
            "group": "200",
            "type": "Number",
            "optional": false,
            "field": "laugh",
            "description": "<p>The number of laughs</p>"
          },
          {
            "group": "200",
            "type": "Number",
            "optional": false,
            "field": "surprise",
            "description": "<p>The number of surprises</p>"
          },
          {
            "group": "200",
            "type": "Number",
            "optional": false,
            "field": "mad",
            "description": "<p>The number of mads</p>"
          },
          {
            "group": "200",
            "type": "Number",
            "optional": false,
            "field": "sad",
            "description": "<p>The number of sads</p>"
          },
          {
            "group": "200",
            "type": "Boolean|String",
            "optional": false,
            "field": "selected",
            "description": "<p>False if requester has not reacted, else it shows their reaction (e.g. &quot;like&quot;)</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 200 OK\n    {\n        \"selected\": \"like\",\n        \"like\": 423,\n        \"love\": 1232,\n        \"laugh\": 903,\n        \"surprise\": 23,\n        \"mad\": 43,\n        \"sad\": 12\n    }",
          "type": "json"
        }
      ]
    },
    "filename": "_api_doc/_reactions_api_doc.js",
    "groupTitle": "Post",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/posts/:postId/reaction"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
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
            "field": "401",
            "description": "<p>Invalid or missing token in Authorization header (Authorization: bearer <token>)</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "403",
            "description": "<p>Unauthorized</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "404",
            "description": "<p>Post not found</p>"
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
        },
        {
          "title": "PostNotFound:",
          "content": "HTTP/1.1 404 Resource Not Found\n    {\n        \"error\": \"Post not found\"\n    }",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "get",
    "url": "/api/:postId/comments",
    "title": "List Post Comments",
    "description": "<p>Comment on a post</p>",
    "name": "GetApiPostIdComments",
    "group": "Post",
    "version": "0.1.0",
    "permission": [
      {
        "name": "LoginRequired",
        "title": "Require login",
        "description": ""
      },
      {
        "name": "PostRead",
        "title": "Require scope \"post:read\"",
        "description": "<p>Assigned to all Users by default</p>"
      },
      {
        "name": "CommentRead",
        "title": "Require scope \"comment:read\"",
        "description": "<p>Assigned to all Users by default</p>"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "Object[]",
            "optional": false,
            "field": "data",
            "description": "<p>A list of the comments on the post</p>"
          },
          {
            "group": "200",
            "type": "ObjectID",
            "optional": false,
            "field": "data._id",
            "description": "<p>The ID of the comment</p>"
          },
          {
            "group": "200",
            "type": "Date",
            "optional": false,
            "field": "data.createdAt",
            "description": "<p>The timestamp of when the comment was posted</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "    HTTP/1.1 200 OK\n  [\n      {\n        \"_id\": \"5f41ed74c025ae6116189890\",\n        \"createdAt\": \"2020-08-23T04:15:48.491Z\"\n      },\n      {\n        \"_id\": \"5f41ed7fc025ae6116189891\",\n        \"createdAt\": \"2020-08-23T04:15:59.824Z\"\n      }\n]",
          "type": "json"
        }
      ]
    },
    "filename": "_api_doc/_comment_api_doc.js",
    "groupTitle": "Post",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/:postId/comments"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
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
    "type": "get",
    "url": "/api/posts/:postId",
    "title": "Get Specific Post",
    "description": "<p>Retrieves the information of a specific post</p>",
    "name": "GetApiPostsPostID",
    "group": "Post",
    "version": "0.1.0",
    "permission": [
      {
        "name": "LoginRequired",
        "title": "Require login",
        "description": ""
      },
      {
        "name": "PostRead",
        "title": "Require scope \"post:read\"",
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
            "field": "type",
            "description": "<p>The type of post (e.g. &quot;ContentPost&quot;)</p>"
          },
          {
            "group": "200",
            "type": "Object",
            "optional": false,
            "field": "content",
            "description": "<p>The content of the post (varies based on type)</p>"
          },
          {
            "group": "200",
            "type": "String",
            "optional": false,
            "field": "caption",
            "description": "<p>The ID of the newly created post</p>"
          },
          {
            "group": "200",
            "type": "String[]",
            "optional": false,
            "field": "tags",
            "description": "<p>The ID of the newly created post</p>"
          },
          {
            "group": "200",
            "type": "ObjectID",
            "optional": false,
            "field": "postedBy",
            "description": "<p>The ID of the newly created post</p>"
          },
          {
            "group": "200",
            "type": "Date",
            "optional": false,
            "field": "createdAt",
            "description": "<p>The ID of the newly created post</p>"
          },
          {
            "group": "200",
            "type": "Date",
            "optional": false,
            "field": "updatedAt",
            "description": "<p>The ID of the newly created post</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "{\n    \"caption\": \"Check out the new shoe!\",\n    \"tags\": [\"shoe\", \"designer\"],\n    \"_id\": \"5f4155c1284bd74c053c2ffe\",\n    \"type\": \"ContentPost\",\n    \"content\": {\n        \"price\": 99.99,\n        \"media\": {\n            \"key\": \"2998472058f3455c6843ece354b90af0_ContentPost\",\n            \"mimetype\": \"image/png\"\n        }\n    },\n    \"postedBy\": \"5f4155c0284bd74c053c2ff9\",\n    \"createdAt\": \"2020-08-22T17:28:33.161Z\",\n    \"updatedAt\": \"2020-08-22T17:28:33.161Z\"\n}",
          "type": "json"
        }
      ]
    },
    "filename": "_api_doc/_post_api_doc.js",
    "groupTitle": "Post",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/posts/:postId"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
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
            "field": "401",
            "description": "<p>Invalid or missing token in Authorization header (Authorization: bearer <token>)</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "403",
            "description": "<p>Unauthorized</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "404",
            "description": "<p>Post not found</p>"
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
        },
        {
          "title": "PostNotFound:",
          "content": "HTTP/1.1 404 Resource Not Found\n    {\n        \"error\": \"Post not found\"\n    }",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "get",
    "url": "/api/posts",
    "title": "List All Posts",
    "description": "<p>Retrieve a list of all the posts IDs</p>",
    "name": "GetPosts",
    "group": "Post",
    "version": "0.1.0",
    "permission": [
      {
        "name": "LoginRequired",
        "title": "Require login",
        "description": ""
      },
      {
        "name": "PostRead",
        "title": "Require scope \"post:read\"",
        "description": "<p>Assigned to all Users by default</p>"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "Object[]",
            "optional": false,
            "field": "body",
            "description": "<p>A list of all posts</p>"
          },
          {
            "group": "200",
            "type": "ObjectID",
            "optional": false,
            "field": "body[index]",
            "description": "<p>._id ID of post</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 200 OK\n[\n    {\n        \"_id\": \"5f4142d2df64933395456dde\",\n        \"createdAt\": \"2020-08-22T16:07:46.915Z\"\n    },\n    {\n        \"_id\": \"5f4142d3df64933395456de1\",\n        \"createdAt\": \"2020-08-22T16:07:47.174Z\"\n    }\n]",
          "type": "json"
        }
      ]
    },
    "filename": "_api_doc/_post_api_doc.js",
    "groupTitle": "Post",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/posts"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
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
    "type": "put",
    "url": "/api/posts/:postId/reaction",
    "title": "React to Post",
    "description": "<p>React to a specific post</p>",
    "version": "0.1.0",
    "name": "PostAPIPostsPostIdReaction",
    "group": "Post",
    "permission": [
      {
        "name": "LoginRequired",
        "title": "Require login",
        "description": ""
      },
      {
        "name": "PostEditContent",
        "title": "Require scope \"post:edit_content\"",
        "description": "<p>Assigned to all Users by default</p>"
      },
      {
        "name": "PostInteract",
        "title": "Require scope \"post:interact\"",
        "description": "<p>Assigned to all Users by default</p>"
      }
    ],
    "parameter": {
      "fields": {
        "Request body": [
          {
            "group": "Request body",
            "type": "String",
            "optional": false,
            "field": "reaction",
            "description": "<p>Options: &quot;like&quot;, &quot;love&quot;, &quot;laugh&quot;, &quot;surprise&quot;, &quot;mad&quot;, or &quot;sad&quot;</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "ObjectID",
            "optional": false,
            "field": "_id",
            "description": "<p>The ID of the post</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 200 OK\n    {\n        \"_id\": \"5f400fb18b012a65ef46044b\",\n    }",
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
            "description": "<p>Invalid reaction</p>"
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
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "404",
            "description": "<p>Post not found</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "InvalidReaction: ",
          "content": "HTTP/1.1 400 Bad Request\n    {\n        \"error\":  \"Missing or invalid reaction in request body\"\n    }",
          "type": "json"
        },
        {
          "title": "NotLoggedIn:",
          "content": "HTTP/1.1 401 Unauthorized\n    {\n        \"error\": \"UnauthorizedError: Invalid or missing JWT token.\"\n    }",
          "type": "json"
        },
        {
          "title": "BadPermissions:",
          "content": "HTTP/1.1 403 Forbidden\n    {\n        \"error\": \"Insufficient permissions\"\n    }",
          "type": "json"
        },
        {
          "title": "PostNotFound:",
          "content": "HTTP/1.1 404 Resource Not Found\n    {\n        \"error\": \"Post not found\"\n    }",
          "type": "json"
        }
      ]
    },
    "filename": "_api_doc/_reactions_api_doc.js",
    "groupTitle": "Post",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/posts/:postId/reaction"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/api/posts?type=ContentPost",
    "title": "Create Content Post",
    "description": "<p>Create a new content post</p>",
    "name": "PostApiPosts",
    "group": "Post",
    "version": "0.1.0",
    "permission": [
      {
        "name": "LoginRequired",
        "title": "Require login",
        "description": ""
      },
      {
        "name": "PostCreate",
        "title": "Require scope \"post:create\"",
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
            "field": "media",
            "description": "<p><code>Required</code> An image or video file to accompany the post</p>"
          },
          {
            "group": "Form Data",
            "type": "Number",
            "optional": false,
            "field": "price",
            "description": "<p><code>Required</code> Price (Non-Negative)</p>"
          },
          {
            "group": "Form Data",
            "type": "String",
            "optional": true,
            "field": "caption",
            "description": "<p>Description of the post (MaxLength: 300 characters)</p>"
          },
          {
            "group": "Form Data",
            "type": "String",
            "optional": true,
            "field": "tags",
            "description": "<p>Comma delimited tags (Max: 7, MaxLength: 20 characters per tag, must be alphabetical)</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "ObjectID",
            "optional": false,
            "field": "ID",
            "description": "<p>The ID of the newly created post</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 200 OK\n{\n   \"_id\" : \"5f4142d3df64933395456de1\"\n}",
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
            "description": "<p>Missing required fields, invalid fields (price greater than zero, too many tags, etc)</p>"
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
    "filename": "_api_doc/_post_api_doc.js",
    "groupTitle": "Post",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/posts?type=ContentPost"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
          }
        ]
      }
    }
  },
  {
    "type": "put",
    "url": "/api/posts/:postId",
    "title": "Edit Post",
    "description": "<p>Edit one of your posts</p>",
    "name": "PutApiPostsPostID",
    "group": "Post",
    "version": "0.1.0",
    "permission": [
      {
        "name": "LoginRequired",
        "title": "Require login",
        "description": ""
      },
      {
        "name": "OwnershipRequired",
        "title": "Require Ownership",
        "description": "<p>Must own the resource you are requesting</p>"
      },
      {
        "name": "PostEditContent",
        "title": "Require scope \"post:edit_content\"",
        "description": "<p>Assigned to all Users by default</p>"
      }
    ],
    "parameter": {
      "fields": {
        "Request Body": [
          {
            "group": "Request Body",
            "type": "String",
            "optional": true,
            "field": "caption",
            "description": "<p>Caption to show below the post (MaxLength: 300 characters)</p>"
          },
          {
            "group": "Request Body",
            "type": "String",
            "optional": true,
            "field": "tags",
            "description": "<p>Comma delimited tags (Max: 7, MaxLength: 20 characters per tag, must be alphabetical)</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "ObjectID",
            "optional": false,
            "field": "ID",
            "description": "<p>The ID of the newly updated post</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 200 OK\n{\n   \"_id\" : \"5f4142d3df64933395456de1\"\n}",
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
            "description": "<p>Invalid fields (too many tags, too long of a caption, etc.)</p>"
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
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "404",
            "description": "<p>Post not found</p>"
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
        },
        {
          "title": "PostNotFound:",
          "content": "HTTP/1.1 404 Resource Not Found\n    {\n        \"error\": \"Post not found\"\n    }",
          "type": "json"
        }
      ]
    },
    "filename": "_api_doc/_post_api_doc.js",
    "groupTitle": "Post",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/posts/:postId"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
          }
        ]
      }
    }
  },
  {
    "type": "delete",
    "url": "/api/:commentId/replies/:replyId",
    "title": "Delete Reply",
    "description": "<p>Delete one of your replies</p>",
    "name": "DeleteApiCommentIdRepliesReplyId",
    "group": "Reply",
    "version": "0.1.0",
    "permission": [
      {
        "name": "LoginRequired",
        "title": "Require login",
        "description": ""
      },
      {
        "name": "OwnershipRequired",
        "title": "Require Ownership",
        "description": "<p>Must own the resource you are requesting</p>"
      },
      {
        "name": "PostEditContent",
        "title": "Require scope \"post:edit_content\"",
        "description": "<p>Assigned to all Users by default</p>"
      },
      {
        "name": "CommentEditContent",
        "title": "Require scope \"comment:edit_content\"",
        "description": "<p>Assigned to all Users by default</p>"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "ObjectID",
            "optional": false,
            "field": "id",
            "description": "<p>The ID of the reply</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "  HTTP/1.1 200 OK\n{\n  \"_id\": \"5f400fb18b012a65ef46044b\",\n}",
          "type": "json"
        }
      ]
    },
    "filename": "_api_doc/_reply_api_doc.js",
    "groupTitle": "Reply",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/:commentId/replies/:replyId"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
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
            "field": "403",
            "description": "<p>Unauthorized</p>"
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
            "field": "404",
            "description": "<p>Comment not found</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "NotOwner:",
          "content": "HTTP/1.1 403 Forbidden\n    {\n        \"error\": \"User is not authorized to access resource\"\n    }",
          "type": "json"
        },
        {
          "title": "NotLoggedIn:",
          "content": "HTTP/1.1 401 Unauthorized\n    {\n        \"error\": \"UnauthorizedError: Invalid or missing JWT token.\"\n    }",
          "type": "json"
        },
        {
          "title": "BadPermissions:",
          "content": "HTTP/1.1 403 Forbidden\n    {\n        \"error\": \"Insufficient permissions\"\n    }",
          "type": "json"
        },
        {
          "title": "CommentNotFound:",
          "content": "HTTP/1.1 404 Resource Not Found\n    {\n        \"error\": \"Comment not found\"\n    }",
          "type": "json"
        },
        {
          "title": "ReplyNotFound:",
          "content": "HTTP/1.1 404 Resource Not Found\n    {\n        \"error\": \"Reply not found\"\n    }",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "delete",
    "url": "/api/:commentId/replies/:replyId/likes",
    "title": "Unlike",
    "description": "<p>Unlike a reply</p>",
    "name": "DeleteApiCommentIdRepliesReplyIdLikes",
    "group": "Reply",
    "version": "0.1.0",
    "permission": [
      {
        "name": "LoginRequired",
        "title": "Require login",
        "description": ""
      },
      {
        "name": "PostEditContent",
        "title": "Require scope \"post:edit_content\"",
        "description": "<p>Assigned to all Users by default</p>"
      },
      {
        "name": "CommentInteract"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "ObjectID",
            "optional": false,
            "field": "id",
            "description": "<p>The ID of the reply</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "  HTTP/1.1 200 OK\n{\n  \"_id\": \"5f400fb18b012a65ef46044b\",\n}",
          "type": "json"
        }
      ]
    },
    "filename": "_api_doc/_reply_api_doc.js",
    "groupTitle": "Reply",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/:commentId/replies/:replyId/likes"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
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
            "field": "401",
            "description": "<p>Invalid or missing token in Authorization header (Authorization: bearer <token>)</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "403",
            "description": "<p>Unauthorized</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "404",
            "description": "<p>Comment not found</p>"
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
        },
        {
          "title": "CommentNotFound:",
          "content": "HTTP/1.1 404 Resource Not Found\n    {\n        \"error\": \"Comment not found\"\n    }",
          "type": "json"
        },
        {
          "title": "ReplyNotFound:",
          "content": "HTTP/1.1 404 Resource Not Found\n    {\n        \"error\": \"Reply not found\"\n    }",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "get",
    "url": "/api/:commentId/replies/:replyId",
    "title": "Get Specific Reply",
    "description": "<p>Retrieves a specific reply</p>",
    "name": "GetApiCommentIdRepliesReplyId",
    "group": "Reply",
    "version": "0.1.0",
    "permission": [
      {
        "name": "LoginRequired",
        "title": "Require login",
        "description": ""
      },
      {
        "name": "PostRead",
        "title": "Require scope \"post:read\"",
        "description": "<p>Assigned to all Users by default</p>"
      },
      {
        "name": "CommentRead",
        "title": "Require scope \"comment:read\"",
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
            "field": "text",
            "description": "<p>The reply text</p>"
          },
          {
            "group": "200",
            "type": "ObjectID",
            "optional": false,
            "field": "postedBy",
            "description": "<p>The ID of the replier</p>"
          },
          {
            "group": "200",
            "type": "Date",
            "optional": false,
            "field": "createdAt",
            "description": "<p>The timestamp the reply was posted</p>"
          },
          {
            "group": "200",
            "type": "Number",
            "optional": false,
            "field": "likes",
            "description": "<p>Number of likes</p>"
          },
          {
            "group": "200",
            "type": "Boolean",
            "optional": false,
            "field": "Whether",
            "description": "<p>or not the requester has liked this reply or not</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "  HTTP/1.1 200 OK\n{\n  text: \"What a reply!\",\n  postedBy: \"5f400fb18b012a65ef46044b\",\n  createdAt: \"2020-08-21T18:17:21.586Z\",\n  likes: 0,\n  liked: false\n}",
          "type": "json"
        }
      ]
    },
    "filename": "_api_doc/_reply_api_doc.js",
    "groupTitle": "Reply",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/:commentId/replies/:replyId"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
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
            "field": "401",
            "description": "<p>Invalid or missing token in Authorization header (Authorization: bearer <token>)</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "403",
            "description": "<p>Unauthorized</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "404",
            "description": "<p>Comment not found</p>"
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
        },
        {
          "title": "CommentNotFound:",
          "content": "HTTP/1.1 404 Resource Not Found\n    {\n        \"error\": \"Comment not found\"\n    }",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "post",
    "url": "/api/:commentId/replies",
    "title": "Create a Reply",
    "description": "<p>Adds a reply to a comment</p>",
    "name": "PostApiCommentIdReplies",
    "group": "Reply",
    "version": "0.1.0",
    "permission": [
      {
        "name": "LoginRequired",
        "title": "Require login",
        "description": ""
      },
      {
        "name": "PostEditContent",
        "title": "Require scope \"post:edit_content\"",
        "description": "<p>Assigned to all Users by default</p>"
      },
      {
        "name": "CommentEditContent",
        "title": "Require scope \"comment:edit_content\"",
        "description": "<p>Assigned to all Users by default</p>"
      }
    ],
    "parameter": {
      "fields": {
        "Request body": [
          {
            "group": "Request body",
            "type": "String",
            "optional": false,
            "field": "text",
            "description": "<p><code>Required</code> Reply (Cannot exceed 300 characters or be empty)</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "id": [
          {
            "group": "id",
            "type": "ObjectID",
            "optional": false,
            "field": "id",
            "description": "<p>The ID of the reply that was created</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "  HTTP/1.1 200 OK\n{\n  \"_id\" : \"5f400fb18b012a65ef46044b\"\n}",
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
            "description": "<p>Bad Request: Text not included or too long</p>"
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
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "404",
            "description": "<p>Comment not found</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "TooLong:",
          "content": "HTTP/1.1 400 Bad Request\n  {\n      \"error\": \"Text must be less than 300 characters\"\n  }",
          "type": "json"
        },
        {
          "title": "NotLoggedIn:",
          "content": "HTTP/1.1 401 Unauthorized\n    {\n        \"error\": \"UnauthorizedError: Invalid or missing JWT token.\"\n    }",
          "type": "json"
        },
        {
          "title": "BadPermissions:",
          "content": "HTTP/1.1 403 Forbidden\n    {\n        \"error\": \"Insufficient permissions\"\n    }",
          "type": "json"
        },
        {
          "title": "CommentNotFound:",
          "content": "HTTP/1.1 404 Resource Not Found\n    {\n        \"error\": \"Comment not found\"\n    }",
          "type": "json"
        },
        {
          "title": "ReplyNotFound:",
          "content": "HTTP/1.1 404 Resource Not Found\n    {\n        \"error\": \"Reply not found\"\n    }",
          "type": "json"
        }
      ]
    },
    "filename": "_api_doc/_reply_api_doc.js",
    "groupTitle": "Reply",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/:commentId/replies"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
          }
        ]
      }
    }
  },
  {
    "type": "put",
    "url": "/api/:commentId/replies/:replyId/likes",
    "title": "Like",
    "description": "<p>Like a reply</p>",
    "name": "PutApiCommentIdRepliesReplyIdLikes",
    "group": "Reply",
    "version": "0.1.0",
    "permission": [
      {
        "name": "LoginRequired",
        "title": "Require login",
        "description": ""
      },
      {
        "name": "PostEditContent",
        "title": "Require scope \"post:edit_content\"",
        "description": "<p>Assigned to all Users by default</p>"
      },
      {
        "name": "CommentInteract"
      }
    ],
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "ObjectID",
            "optional": false,
            "field": "id",
            "description": "<p>The ID of the reply</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "  HTTP/1.1 200 OK\n{\n  \"_id\": \"5f400fb18b012a65ef46044b\",\n}",
          "type": "json"
        }
      ]
    },
    "filename": "_api_doc/_reply_api_doc.js",
    "groupTitle": "Reply",
    "sampleRequest": [
      {
        "url": "http://localhost:3000/api/:commentId/replies/:replyId/likes"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
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
            "field": "401",
            "description": "<p>Invalid or missing token in Authorization header (Authorization: bearer <token>)</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "403",
            "description": "<p>Unauthorized</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "404",
            "description": "<p>Comment not found</p>"
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
        },
        {
          "title": "CommentNotFound:",
          "content": "HTTP/1.1 404 Resource Not Found\n    {\n        \"error\": \"Comment not found\"\n    }",
          "type": "json"
        },
        {
          "title": "ReplyNotFound:",
          "content": "HTTP/1.1 404 Resource Not Found\n    {\n        \"error\": \"Reply not found\"\n    }",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "delete",
    "url": "/api/users/:userId/",
    "title": "Delete User",
    "description": "<p>Permanently removes a user and all their information (i.e. profile photo form S3, any followers/followings)</p>",
    "name": "DeleteApiUsersUserId",
    "group": "User",
    "version": "0.1.0",
    "permission": [
      {
        "name": "LoginRequired",
        "title": "Require login",
        "description": ""
      },
      {
        "name": "OwnershipRequired",
        "title": "Require Ownership",
        "description": "<p>Must own the resource you are requesting</p>"
      },
      {
        "name": "UserDelete",
        "title": "Require scope \"user:delete\"",
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
        "url": "http://localhost:3000/api/users/:userId/"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
          }
        ]
      }
    }
  },
  {
    "type": "delete",
    "url": "/api/users/:userId/avatar",
    "title": "Delete Profile Photo",
    "description": "<p>Permanently removes user profile photo</p>",
    "name": "DeleteApiUsersUserIdAvatar",
    "group": "User",
    "version": "0.1.0",
    "permission": [
      {
        "name": "LoginRequired",
        "title": "Require login",
        "description": ""
      },
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
        "url": "http://localhost:3000/api/users/:userId/avatar"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
          }
        ]
      }
    }
  },
  {
    "type": "delete",
    "url": "/api/users/:userId/follow",
    "title": "Unfollow Someone",
    "description": "<p>The requester unfollows user with ID :userId</p>",
    "name": "DeleteApiUsersUserIdUnFollow",
    "group": "User",
    "version": "0.1.0",
    "permission": [
      {
        "name": "LoginRequired",
        "title": "Require login",
        "description": ""
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
            "field": "Message",
            "description": "<p>&quot;Successfully unfollowed someone&quot;</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "    HTTP/1.1 200 OK\n{\n    \"message\": \"Successfully unfollowed someone\"\n}",
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
            "description": "<p>Bad Request: Missing ID (Really a Server error you should never see)</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "422",
            "description": "<p>Bad Request: Cannot unfollow self</p>"
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
        "url": "http://localhost:3000/api/users/:userId/follow"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
          }
        ]
      }
    }
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
    "url": "/api/users/:userId/avatar",
    "title": "Get Profile Photo",
    "description": "<p>Retrieve the profile photo from AWS S3 bucket</p>",
    "name": "GetApiUsersUserIdAvatar",
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
        "url": "http://localhost:3000/api/users/:userId/avatar"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
          }
        ]
      }
    }
  },
  {
    "type": "get",
    "url": "/api/users/:userId/follow",
    "title": "Get Followers/Followings",
    "description": "<p>Retrieve a list of :userId&quot;s followers and following.</p>",
    "name": "GetApiUsersUserIdFollow",
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
            "type": "Object[]",
            "optional": false,
            "field": "following",
            "description": "<p>Array of who user followers</p>"
          },
          {
            "group": "200",
            "type": "ObjectID",
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
            "type": "ObjectID",
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
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 200 OK\n    {\n        \"following\": [\n            {\n                \"_id\": \"5f3e184ad4df2d2ab0d5f91b\",\n                \"username\": \"new_user\"\n            }\n        ],\n        \"followers\": [\n            {\n                \"_id\": \"5f3e183dd4df2d2ab0d5f919\",\n                \"username\": \"John\"\n            },\n        ]\n    }",
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
            "description": "<p>Bad Request: Unable to fetch list of followers/following</p>"
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
        "url": "http://localhost:3000/api/users/:userId/follow"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
          }
        ]
      }
    }
  },
  {
    "type": "get",
    "url": "/api/users/:userId",
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
            "field": "cognito_username",
            "description": "<p>The username of the person in Cognito</p>"
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
          },
          {
            "group": "200",
            "type": "Object[]",
            "optional": false,
            "field": "profile_photo",
            "description": "<p>Not present if there is no profile photo but otherwise looks like the example</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 200 OK\n   {\n       \"about\": \"This is a bio\",\n       \"following\": [{\n           \"_id\" : \"5f6565f0c1708f4ad08477c7\",\n           \"username\" : \"user1\"\n       }],\n       \"followers\": [],\n       \"_id\": \"5f6565f0c1708f4ad08477c7\",\n       \"cognito_username\": \"5627cc28-bb8f-4806-9cc9-30e2f4d042ed\",\n       \"username\": \"matthew5\",\n       \"first_name\": \"matt\",\n       \"last_name\": \"burr\",\n       \"createdAt\": \"2020-09-19T01:59:12.041Z\",\n       \"updatedAt\": \"2020-09-19T02:00:28.398Z\",\n       \"profile_photo\": {\n           \"_id\": \"5f65663cc1708f4ad08477c8\",\n           \"key\": \"397fec5422857e916e1fa0abeea28e32_profile_photo\",\n           \"mimetype\": \"image/jpeg\"\n   }",
          "type": "json"
        }
      ]
    },
    "filename": "_api_doc/_user_api_doc.js",
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
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
            "description": "<p>Description of user (Cannot exceed 300 characters)</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n \"first_name\"    : \"John\",\n \"last_name\"     : \"Doe\",\n \"username\"      : \"JohnDoe\",\n \"email\"         : \"John.Doe@gmail.com\",\n \"phone_number\"  : \"+123456789\",\n \"password\"      : \"JohnDoeP@ssw@rd123#\"\n}",
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
            "field": "access_token",
            "description": "<p>JWT access token</p>"
          },
          {
            "group": "200",
            "type": "String",
            "optional": false,
            "field": "id_token",
            "description": "<p>JWT ID token</p>"
          },
          {
            "group": "200",
            "type": "String",
            "optional": false,
            "field": "refresh_token",
            "description": "<p>JWT refresh token</p>"
          },
          {
            "group": "200",
            "type": "ObjectId",
            "optional": false,
            "field": "_id",
            "description": "<p>MongoDB ID of user</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "    HTTP/1.1 200 OK\n{\n    \"access_token\": \"eyJraWQiOiJSOGNuYnFxM2YzV0V6Zk94NVRuRE1NYU5CdUZsU1llU0lJVFZNclRRSTJJPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJkNjM5NGM2NS1kZDRiLTQ4MjUtYmRmZi01YWU1ZDNlMGI5MWYiLCJldmVudF9pZCI6ImExNzU4ZTFjLTllZWQtNDE4Mi1iZDM1LTJmNzk4MGM5YjE2NyIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE2MDAxNzkzMTYsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC51cy1lYXN0LTEuYW1hem9uYXdzLmNvbVwvdXMtZWFzdC0xX3hyU2xrRDhXdSIsImV4cCI6MTYwMDE4MjkxNiwiaWF0IjoxNjAwMTc5MzE2LCJqdGkiOiIyZGZmNzY4OS1iZDIxLTRlNTUtODVjMS1jM2U0MDEyNDNjMmEiLCJjbGllbnRfaWQiOiI2bmZpNjAyMmhwNDZqZm8yNmJrMGE4M3JjdCIsInVzZXJuYW1lIjoiZGJjYTY4NDUtZDQwMC00ZTM3LWJlNzgtM2JlYjdlYjdhNjNhIn0.ay4VyBuN1F2kWFsMRxJ2_GtMPOKQjFUkmuyjX8Z2JbSO2RixjYsRmnLCeRakI7kXfobHxgLKfYGKUJ8TQBxJuaQrAO2dvN_zjpaq3UF4y-zUZPvzzU0jeY4RlgcPgJErU6OduGNjaSWPLHvVah3jicrBvkPCGDQdaXHXziwrTLaiuHAoIfYtuHV4dNhPxTH0o_GQqMhKFTCy06KJXP96kJSTUTVcsFMGaHR2Pr0WvL9Cya7UHrGugNX4zQ7aRMaxcuKUF6GgmFl6ixuLxOzLkXxoAMOnImqI3R7sBrgOzbQVME08HqHxjb_j4sTPYIM1MAdKir6vy2UH1enHEBLMfw\",\n    \"id_token\": \"eyJraWQiOiIyeUJmYzhjWjIwVVJrcWdKZ1R4MktvRW5UT3JYTElWYmNwdkltVlVpVXJrPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJkNjM5NGM2NS1kZDRiLTQ4MjUtYmRmZi01YWU1ZDNlMGI5MWYiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tXC91cy1lYXN0LTFfeHJTbGtEOFd1IiwicGhvbmVfbnVtYmVyX3ZlcmlmaWVkIjp0cnVlLCJjb2duaXRvOnVzZXJuYW1lIjoiZGJjYTY4NDUtZDQwMC00ZTM3LWJlNzgtM2JlYjdlYjdhNjNhIiwicHJlZmVycmVkX3VzZXJuYW1lIjoibWF0dGhldzQiLCJhdWQiOiI2bmZpNjAyMmhwNDZqZm8yNmJrMGE4M3JjdCIsImV2ZW50X2lkIjoiYTE3NThlMWMtOWVlZC00MTgyLWJkMzUtMmY3OTgwYzliMTY3IiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE2MDAxNzkzMTYsInBob25lX251bWJlciI6IisxNTAyNjg5MTgyMyIsImV4cCI6MTYwMDE4MjkxNiwiaWF0IjoxNjAwMTc5MzE2LCJlbWFpbCI6Im5ld191c2VyM0BnbWFpbC5jb20ifQ.uiQOxEKXjv2zsu89yQUAnWjIJCixFWK4Y_AIZcV3--U3T3OooLnWn9n-2dfNKbH8TscNyN1nfjI6z8FPTRpx0ysu8qcCsUUI6rCC83GDQD1NeDmyrg9yMCmVEnn3fs-jNgQGhjRKK3fA3_VC7JmMrSFQii-rDOnPgY7YhSKNvqRsnI8R3QWUw47A0MyrGPrT4Wq-mZ-IF5i9flLj7_pWDZl0DQlOjTbjRR-xB_CAcfElGog_-ZogXWChXvT0OHHy43DL4r03nipcLms03OWtbtJInbK4pljo1zZqgXxEHL01xuvkQSW356GE1P8aMUIqDHmu-maYkQsS885lAPuu1w\",\n    \"refresh_token\": \"eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ.WpNRmabYPIcOgF3UsUHyPRwsSIqvaahnLAHFErJgiOpzcGvsQBeA9cDhcGPrMSRAV3wpXxvjbJbvIKmsiA1EDBRkEcQC2wSpjPQDEe6syHI2PMKJX2aQhE_WgH574KQEhpjdHKDox4wH6LrOxjuGCiaZtAIPzavp5aOch8M3Y4Otata_VEC2ZNcUo0fDaMuObEVFMQfHSr_UgVjyzft-fcjZ2L06kbkNdmsUXn-YZ0jfn-rV4x_YBuhUmr_JuhXbbpEkfLWA5VbzeYJ2nvPDr_CeI-SFfhgCoD__TViN7NiLl1kNYXJ5dN41jkpp-5-R3noJQA3cglItYdeG8eNR-A.wfiYYQC4Ipz6VIxu.EEk89oAYxpxF3E-PoOG-fwtB7bReJcrV_lPUk0j4j4JDGGluGIpTBB5amn6-W6AFphwY_EcrPRngrB48cPO5FIAj919MrHrufPsL0rsHaUMgd1n5WZe8Ra8e9F5dlWA8u35UfYgVO-GqF_DaIMb3wL2wPGA-dewt9PQzOYXhAbvAEb2649qHJ5Kni5sd1X3cOE29gMLoeN7bTPRAVytsXH3XEfAmxk4gaD2ju3ooCiyVGlPNO_WbG5le7uNL4xjR-lw7n6fgjcX33vNt9zfmz5mmpW9kV-YeBXF5N8Q_LLAbBfMFgXTJYZSE-Q4m7dUncMo4c-GIWnUXmq3Cw6GFtwwsl8n7Oda1gMGnj7LFr7bLMS2HiHctrGQ_5Uwz20vGIk5_kiO6u0Vhy6XOfocqsQ2A3qrJgYycVGiOaJjsgrZliTu0tW7RyRkihqCWIE9BMU-YB3hTm7pynDiuqpZ-cfGD4pmPkrKDvYv2U64N7ZfoioQjo2Kbma1RX1eYPqVJDWJXATWCTppYddRlla7UneIt8zmjFDhwH1tijR0sl3r1kmYzJbpqJ-YwQLGWjNy0M_40Fy4fEs---EZ1KKXE22UvwUZ9fzRQZ6aF2SCkdZCE18CpdVgCT-xtwRsTlmzxxmbqAIaVrsL92Rz4mCYpA-QVWb6UhlqgNbAmzg21ui8QNgajfL1GgVTkHxlqVJV15o7JvPvp8S7csNk9nnUms2Vg2YOhAbBMXWFXbxNzvQfxF4Ah4HdeDAbnaFEkk4iPYhQgehAkUxc_WZdWt03aQ9V3y2b6Y6Ar6j96ZQZ7YCPW_aubUYwPhM9Y39lT8p0jI1w47_NSDgQxJ9XT80NOIEH91sZOEN66qrFFdEFAi-naKAhUc0-V6w98vaojQu_g3pEgsLJmOL8zsNRVpxXAxiDzgMFzGRsc3tWhQVZ0QSBjH2Go0kAcYELx3eSrRK0fjwIUnYXRsJZn8JyhDflrxOaZo8TgMTJx8BHQkbQbCY9z2P1_W1CrNipewQaS5RloTTTFZCkTJCUsq_h99706wU6p5k1pNtgzOFULA1MDatm3nWOg1yKtdsxn89HZ_Vks1waUdWqIJwH2Yg3O3-SnMYnQMoxtb5a8ZjNmv9F49MMRreNHUxWp427vmV1Pk75BK_EoExUo5X6onjuEu9DgVgqQlCygdDsBlmVNnI0PNrLjz8ojxCY9A7df_VTZjDN1HpPlDq271VKCQGsi-51A9Y2xJ43ZU2taiSbZ64IbcTRmAFJ0pZJYWgN9vNXoRxzwha8KS58DmeVfNAg4TjQWL9-QdScFU0nnLJfIzHVMkZ1O1KBpFZJBOmdmAQ.BsLVaQWZUM32Oq6XVhh_Vw\",\n    \"_id\": \"5f60cc7422add441148a35ea\"\n}",
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
          "content": "HTTP/1.1 400 Internal Server Error\n{\n  \"error\": \"Valid alphanumeric username (underscores allowed) is required\"\n}",
          "type": "json"
        },
        {
          "title": "Invalid field:",
          "content": "HTTP/1.1 400 Internal Server Error\n    {\n        \"error\": \"Bad request: The following are invalid fields \"bad_key\"\"\n    }",
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
    "url": "/api/users/:userId/avatar",
    "title": "Update Profile Photo",
    "description": "<p>Updates the user&quot;s profile photo by storing it in an AWS S3 bucket.</p>",
    "name": "PostApiUsersUserIdAvatar",
    "group": "User",
    "version": "0.1.0",
    "permission": [
      {
        "name": "LoginRequired",
        "title": "Require login",
        "description": ""
      },
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
            "field": "media",
            "description": "<p><code>Required</code>Profile image to upload</p>"
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
        "url": "http://localhost:3000/api/users/:userId/avatar"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
          }
        ]
      }
    }
  },
  {
    "type": "put",
    "url": "/api/users/:userId/",
    "title": "Update Profile Information",
    "description": "<p>Update profile of a specific user and returns the updated profile to that user.</p>",
    "name": "PutApiUsersUserId",
    "group": "User",
    "version": "0.1.0",
    "permission": [
      {
        "name": "LoginRequired",
        "title": "Require login",
        "description": ""
      },
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
            "description": "<p>Description of user (Cannot exceed 300 characters) * @apiSuccess (200) {Object} DeletedUser The user that has been deleted.</p>"
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
            "field": "400",
            "description": "<p>Invalid update. The fields are likely not correct (see parameter requirements).</p>"
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
        "url": "http://localhost:3000/api/users/:userId/"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
          }
        ]
      }
    }
  },
  {
    "type": "put",
    "url": "/api/users/:userId/follow",
    "title": "Follow Someone",
    "description": "<p>The requester follows user with ID :userId</p>",
    "name": "PutApiUsersUserIdFollow",
    "group": "User",
    "version": "0.1.0",
    "permission": [
      {
        "name": "LoginRequired",
        "title": "Require login",
        "description": ""
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
            "field": "Message",
            "description": "<p>&quot;Following someone new!&quot;</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "    HTTP/1.1 200 OK\n{\n    \"message\": \"Following someone new!\"\n}",
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
            "description": "<p>Bad Request: Missing ID (Really a Server error you should never see)</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "422",
            "description": "<p>Bad Request: Cannot follow self</p>"
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
        "url": "http://localhost:3000/api/users/:userId/follow"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
          }
        ]
      }
    }
  },
  {
    "type": "put",
    "url": "/api/users/:userId/password",
    "title": "Update Password",
    "description": "<p>Update profile of a specific user and returns the updated profile to that user.</p>",
    "name": "PutApiUsersUserIdPassword",
    "group": "User",
    "version": "0.1.0",
    "permission": [
      {
        "name": "LoginRequired",
        "title": "Require login",
        "description": ""
      },
      {
        "name": "OwnershipRequired",
        "title": "Require Ownership",
        "description": "<p>Must own the resource you are requesting</p>"
      },
      {
        "name": "UserChangePassword",
        "title": "Require scope \"user:change_password\"",
        "description": "<p>Assigned to all Users by default</p>"
      }
    ],
    "parameter": {
      "fields": {
        "Request body": [
          {
            "group": "Request body",
            "type": "String",
            "optional": false,
            "field": "password",
            "description": "<p><code>Required</code> Password (at least 7 characters; at least 1 number; at least one of @, !, #, $, % or ^; at least 1 uppercase letter)</p>"
          },
          {
            "group": "Request body",
            "type": "String",
            "optional": false,
            "field": "old_password",
            "description": "<p><code>Required</code> Must match old password</p>"
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
            "description": "<p>&quot;Successfully updated password&quot;</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "    HTTP/1.1 200 OK\n{\n    \"message\": \"Successfully updated password\"\n}",
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
            "description": "<p>Invalid Fields: Either missing required fields or including additional.</p>"
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "400",
            "description": "<p>Bad Request: New password is too short, the same as the old password, old_password doesn&quot;t match the current password, etc.</p>"
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
          "title": "UnprocessableEntity: ",
          "content": "HTTP/1.1 422 Unprocessable Entity\n    {\n        \"error\": \"(Bad request) The following are fields are required old_password\"\n    }",
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
        "url": "http://localhost:3000/api/users/:userId/password"
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
            "description": "<p>Bearer <code>JWT token</code> (Note: Optionally you can provide the query parameter as such &quot;access_token=&lt;YOUR_TOKEN&gt;&quot;)</p>"
          }
        ]
      }
    }
  }
] });
