"use strict";

import mongoose from 'mongoose';

const drop_database = async () => {
    console.log('Dropped testing database')
    return mongoose.connection.dropDatabase()
};

export {
    drop_database
}