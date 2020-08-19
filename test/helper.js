"use strict";

import mongoose from 'mongoose';

const drop_database = async () => {
    return mongoose.connection.dropDatabase()
};

const drop_database2 = async (next) => {
    await mongoose.connection.dropDatabase()
    next();
};

const buffer_equality = (buf1, buf2) =>
{
    if (buf1.byteLength != buf2.byteLength) return false;
    var dv1 = new Int8Array(buf1);
    var dv2 = new Int8Array(buf2);
    for (var i = 0 ; i != buf1.byteLength ; i++)
    {
        if (dv1[i] != dv2[i]) return false;
    }
    return true;
}

export {
    drop_database,drop_database2,
    buffer_equality
}