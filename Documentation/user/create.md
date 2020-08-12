# Create new User

Create a New User

**URL** : `/api/users/`

**Method** : `POST`

**Auth required** : NO

**Data constraints**: Required

```json
{
    "first_name": "[first name]",
    "last_name": "[last name]",
    "username": "[alpnanumeric (underscore allowed); < 17 characters]",
    "email": "[valid email address]",
    "password": "[password in plain text]"
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
    "token": "93144b288eb1fdccbe46d6fc0f241a51766ecd3d"
}
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
