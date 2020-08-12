"use strict";

const drop_database = (mongoose) => {
    console.log('Dropping DataBase.')
    return mongoose.connection.dropDatabase();
}

export {
    drop_database
}