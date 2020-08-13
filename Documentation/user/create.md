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
    "username": "[unique alpnanumeric (underscore allowed); < 17 characters]",
    "email": "[unique valid email address]",
    "password": "[> 7 characters; > 1 numeric char; at least one of @, !, #, $, % or ^; > 1 uppercase char; not reserved password (i.e. 'password')]"
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
    "message": "Successfully signed up!"
}
```

## Error Response

**Condition** : Data constraints not met

**Code** : `400 BAD REQUEST`

