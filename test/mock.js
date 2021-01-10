
import Organization from '@server/models/organization.model';
import {ProductData} from '@development/product.data';
import {dropDatabase, loginAdminEmployee} from '@test/helper';
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
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
    const form = FormData();
    form.append('media', fs.createReadStream(newProductData.media));
    for (let i = 0; i < newProductData.additional_media.length; ++i) {
        form.append('additional_media', fs.createReadStream(newProductData.additional_media[i]));
    }
    const product = await fetch( `http://${config.address}:${config.port}/api/products?access_token=${admin.access_token}`, {
        method: 'POST',
        body: form,
    }).then(res=>res.json());
    console.log(product);
    console.log(`Created product with id ${product._id}`);

    // create a product post with the product
    const post = await fetch(`http://${config.address}:${config.port}/api/posts?access_token=${admin.access_token}&type=Product`, {
      method: 'POST',
      body: JSON.stringify({
        product: product._id,
        caption: newProductData.caption,
        tags: newProductData.tags,
      }),
    }).then(res=>res.json())
    console.log(`Created post with id ${post._id}`);
})();