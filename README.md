## Getting Started

### Setting up the Repository

```
git clone <REPOSITORY>
mkdir .env
```

Add the following to .env

```
# MongoDB Dev Environment
MONGO_DEV_PASSWORD = YOUR_PASSWORD_FROM_ATLAS # talk to Matthew
MONGO_DEV_DB_NAME = DevLockerDB

# MongoDB Test Environment
MONGO_TEST_DB_NAME = TestLockerDB
```

Create the directory for local MongoDB inside project base folder

```
mkdir ./data
mkdir ./data/db
```

### Run Tests

Start Mongo Shell

```
sudo mongod --dbpath ./data/db
```

Run tests

```
npm test
```

### Run Development

```
npm run development
```

## Useful Mongo Shell Commands

### Start MongoDB Locally

```bash
sudo mongod --dbpath ./data/db
```

### Terminate MongoDB Locally

```bash
sudo lsof -iTCP -sTCP:LISTEN -n -P
kill -9 <PID>
```

### Connect

```bash
mongo <URI>
```

Example: "mongo mongodb://localhost:27017/TestLockerDB"

The development database can be found here `https://cloud.mongodb.com/v2/5f33f3f7f345b67f0eccb772#clusters/detail/DevLocker`

### Show all dbs

```bash
show dbs
```

### Connect to specific DB

```bash
use <DB>
```

### Drop Specific DB

```bash
use <DB>
db.dropDatabase()
```

### List DB entries

```bash
use <DB>
db.dropDatabase()
```

# API Documentation

```bash
bash createAPIDoc.sh && xdg-open ./Documentation/index.html
```

## Authentication

Authentication is achieved using JSON web tokens (JWT). For example, upon login, the user will send the username and password to the server. The server will verify that this is correct and then sign a JSON object using the secret and the HMAC SHA256 algorithm.

It is up to the client to store this token and to send it in subsequent requests using the header 'Authorization' with content 'Bearer [token]'.

## Authorization

Authorization is also achieved using the JSON web tokens. In the encrypted credentials will be a field called 'role'. This will determine whether or not the person is authorized to perform the action. The id of the person will also be included when it is required to authorize a specific individual (e.g. changing their profile.)

## Permissions, scope, and roles

Permissions and scopes are what are used to authorize various API calls. The JWT token that is included in the credentials will include the permissions and scope of those permissions. Roles will encapsulate the various permissions and scope. For details of all permissions, see `/server/permissions.js` and for the roles see `/server/roles`.

If you navigate to `/server/permissions.js`, you'll see the entire list of scopes that specify the permissions in the format `permission = resource:scope` where `resource` refers to the collection that can be modified according to the scope.

Note: By default, every API call has no permissions. These are only granted after a successful login. The `User` and `Organization` collection have a field called role that encapsulates all the permissions