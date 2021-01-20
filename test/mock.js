
import Organization from '@server/models/organization.model';
import {ProductData} from '@development/product.data';
import {CollectionData} from '@development/collection.data';
import {createProduct, createCollection, dropDatabase, loginAdminEmployee} from '@test/helper';
import fetch from 'node-fetch';
import config from '@config/config';

import '@server/server';

(async () => {
    // drop database
    await dropDatabase();
    console.log("Dropped database.");

    // login the admin
    const admin = await loginAdminEmployee();
    console.log("Logged in admin.");

    // retrieve locker organization
    const anyOrg = await Organization.findOne();
    console.log(`Retrieved organization: ${anyOrg.name}`);

    // create a product
    const newProductData = JSON.parse(JSON.stringify(ProductData[0]));
    newProductData.organization = anyOrg._id.toString();

    const product = await createProduct(newProductData, admin.access_token);
    console.log(`Created product with id ${product._id}`);

    // create a product post with the product
    const post = await fetch(`http://${config.address}:${config.port}/api/posts?access_token=${admin.access_token}&type=Product`, {
      method: 'POST',
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        product: product._id,
        caption: newProductData.caption,
      }),
    }).then(res=>res.json())
    console.log(`Created post with id ${post._id}`);

    // create collection
    const newCollectionData = JSON.parse(JSON.stringify(CollectionData[0]));
    newCollectionData.organization = anyOrg._id.toString();
    newCollectionData.product_list = [product._id];
    const collection = await createCollection(newCollectionData, admin.access_token);
    console.log(`Created collection with id ${collection._id}`);

})();