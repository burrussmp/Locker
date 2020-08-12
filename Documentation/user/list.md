# List All Users

List all users

**URL** : `/api/users/`

**Method** : `GET`

**Auth required** : NO

**Data constraints**

None

## Success Response

**Code** : `200 OK`

**Content example**

```json
[
    {
        "_id": "5f345efbe5bf4a374959a697",
        "name": "UserA",
        "email": "EmailA@mail.com",
        "created": "2020-08-12T21:28:27.713Z",
    },
    ⋮
    ⋮
    {
        "_id": "5f345f5932dd773792386978",
        "name": "UserB",
        "email": "EmailB@mail.com",
        "created": "2020-08-12T21:30:01.149Z",
    }
]
```

## Error Response

**Condition** : If 'username' and 'password' combination is wrong.

**Code** : `400 BAD REQUEST`

**Content** :

```json
{
    "non_field_errors": [
        "Unable to login with provided credentials."
    ]
}
```
