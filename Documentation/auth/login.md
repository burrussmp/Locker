# Login

Login

**URL** : `/auth/login`

**Method** : `POST`

**Auth required** : NO

**Data constraints**: Required

```json
{
    "login": "[phone number or username or email address]",
    "password": "[password plaint text]"
}
```

**Data example**

```json
    {
        "first_name": "Paul",
        "last_name": "Sullivan",
        "username": "paulsullivan123",
        "email": "paul@mail.com",
        "password": "Admin125$",
    }
```

## Success Response

**Code** : `200 OK`

**Content example**

```json
{
    "token": "<JWT token>",
    "user": {
        "_id": "<id of user>",
        "username": "UserA",
        "email" : "usera@mail.com",
    }
}
```

## Error Response

**Condition** : No user with username, password, or phone number

**Code** : `401 Unauthorized Client`

```json
{
    "error": "User not found"
}
```

**Condition** : User found but not matching password

**Code** : `401 Unauthorized Client`

```json
{
    "error": "Invalid password"
}
```

**Condition** : Server issue

**Code** : `500 Internal Server Error`

```json
{
    "error": "Sorry, we could not log you in"
}
```

**Condition** : Missing `login` field

**Code** : `400 Bad Request`

```json
{
    "error": "Missing username, phone number, or email"
}
```

**Condition** : Missing `password` field

**Code** : `400 Bad Request`

```json
{
    "error": "Missing password"
}
```