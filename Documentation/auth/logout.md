# Logout

Logout

**URL** : `/auth/logout`

**Method** : `GET`

**Auth required** : NO

**Data constraints**: None


## Success Response

**Code** : `200 OK`

```json
{
    "message": "Logged out"
}
```

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
