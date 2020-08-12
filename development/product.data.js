"use strict";
import Product from '../server/models/product.model';
import Shop from '../server/models/shop.model';

const ProductData = [{
    name: 'reg grounds (0.5 lb)',
    quantity: 10000,
    price: 8,
    shop: 'CoffeeShop'
}, {
    name: 'dark grounds (0.5 lb)',
    quantity: 8000,
    price: 8,
    shop: 'CoffeeShop'
}, {
    name: 'Book1',
    quantity: 8,
    price: 22.50,
    shop: 'Grains'
}, {
    name: 'Book2',
    quantity: 3,
    price: 16.99,
    shop: 'HeartBrewery'
}];

const addProducts = async () => {
    console.log('Adding Products to DB')
    for (let fake_product of ProductData) {
        let shop = await Shop.findOne({'name':fake_product.shop}).exec();;
        let ref = {shop:shop._id};
        let product_data_fields = {...fake_product,...ref};
        let product = new Product(product_data_fields);
        await product.save();
        console.log(`   Added Product ${product.name} to Shop ${shop.name}`);
    }
    await Product.find({}).populate('shop').exec();
    console.log(`Done adding Products to DB`)
}

export {
    ProductData,
    addProducts
};