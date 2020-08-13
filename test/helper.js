"use strict";

import mongoose from 'mongoose';

const drop_database = async () => {
    return mongoose.connection.dropDatabase()
};

export {
    drop_database
}