"use strict";
import Product from '../server/models/product.model';
import Organization from '../server/models/organization.model';

// should be valid products
const ProductData = [{
    name: 'reg grounds (0.5 lb)',
    quantity: 10000,
    price: 8,
    owner: 'CoffeeShop'
}, {
    name: 'dark grounds (0.5 lb)',
    quantity: 8000,
    price: 8,
    owner: 'CoffeeShop'
}, {
    name: 'Book1',
    quantity: 8,
    price: 22.50,
    owner: 'Grains'
}, {
    name: 'Book2',
    quantity: 3,
    price: 16.99,
    owner: 'HeartBrewery'
}];

const addProducts = async () => {
    console.log('Adding Products to DB')
    for (let fake_product of ProductData) {
        let org = await Organization.findOne({'name':fake_product.owner}).exec();;
        let ref = {owner:org._id};
        let product_data_fields = {...fake_product,...ref};
        let product = new Product(product_data_fields);
        await product.save();
        console.log(`   Added Product ${product.name} to Org ${org.name}`);
    }
    await Product.find({}).populate('owner').exec();
    console.log(`Done adding Products to DB`)
}

export {
    ProductData,
    addProducts
};