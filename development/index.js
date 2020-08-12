"use strict";

import {addUsers} from './user.data';
import {addShops} from './shop.data';
import {addProducts} from './product.data';

import {drop_database} from './helper';

const setup_development_database = async (mongoose) => {
    mongoose.connection.on('open', async (ref) => {
        await drop_database(mongoose)
        await addUsers();
        await addShops()
        await addProducts();
    });
} 

export {
    setup_development_database
}
