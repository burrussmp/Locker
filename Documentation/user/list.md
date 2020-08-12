# List All Users

List all users

**URL** : `/api/users/`

**Method** : `GET`

**Auth required** : NO

**Data constraints** : NONE

## Success Response

**Code** : `200 OK`

**Content example**

```
[
    {
        "_id": "5f34821b0c46f63b28831230",
        "username": "admin",
        "first_name": "admin",
        "last_name": "admin",
        "email": "a@mail.com",
        "updated": "2020-08-12T23:58:19.944Z",
        "created": "2020-08-12T23:58:19.944Z"
    },
    :
    :
    :
    {
        "_id": "5f34821c0c46f63b28831231",
        "username": "matthewpburruss",
        "first_name": "Matthew",
        "last_name": "Burruss",
        "email": "matthew@mail.com",
        "updated": "2020-08-12T23:58:20.137Z",
        "created": "2020-08-12T23:58:20.137Z"
    },

]
```

## Error Response

**Condition** : Unable to connect to database

**Code** : `400 BAD REQUEST`
