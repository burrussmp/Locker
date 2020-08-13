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
MONGO_DEV_DB_NAME = DevOpenMarketDB

# MongoDB Test Environment
MONGO_TEST_DB_NAME = TestOpenMarketDB
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

### Connect

```bash
mongo <URI>
```

Example of a URI: "mongodb://localhost:27017/TestOpenMarketDB"

The development database can be found here `https://cloud.mongodb.com/v2/5f33f3f7f345b67f0eccb772#clusters/detail/DevOpenMarket`

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
