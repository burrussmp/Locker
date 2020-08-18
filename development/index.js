"use strict";

import {addUsers} from './user.data';
import {addOrganizations} from './organization.data';
import {addProducts} from './product.data';

import {drop_database} from './helper';

const setup_development_database = async (mongoose) => {
    mongoose.connection.on('open', async (ref) => {
        await drop_database(mongoose)
        await addUsers();
        await addOrganizations()
        await addProducts();
    });
} 

export {
    setup_development_database
}
