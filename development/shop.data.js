"use strict";
import Shop from '../server/models/shop.model';

// should be valid shops
const ShopData = [{
        name: 'CoffeeShop'
    },
    {
        name: 'Grains'
    },
    {
        name: 'HeartBrewery'
    },
];

const addShops = async () => {
    console.log('Adding Shops to DB');
    for (let fake_shop of ShopData) {
        let shop = new Shop(fake_shop);
        await shop.save();
        console.log(`   Added shop ${shop.name}`)
    }
    console.log(`Done Adding Shops to DB`)
}

export {
    ShopData,
    addShops
};