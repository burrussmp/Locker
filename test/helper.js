"use strict";

import mongoose from 'mongoose';

const drop_database = async () => {
    return mongoose.connection.dropDatabase()
};

const drop_database2 = async (next) => {
    await mongoose.connection.dropDatabase()
    next();
};

export {
    drop_database,drop_database2
}