/* eslint-disable max-len */
import { pickBy } from 'lodash'

const CollectionData = [
  {
    name: "Shoes",
    hero: process.cwd() + "/test/resources/product_assets/intention_star.jpg",
    description: "These are the best shoes",
  },
  {
    name: "Shirts",
    hero:
      process.cwd() + "/test/resources/product_assets/mason_core_rib_tank.jpg",
    description:
      "Women's Mason Basic Rib Tank by Michael Lauren. Made in Los Angeles. Shop designer tank tops for women at michaellaurenclothing.com and enjoy Free US Shipping!",
    tags: ["shirt1", "shirt2", "shirt3"],
  },
];

const getCollectionConstructor = (newCollectionData) => {
    let field = {
        name: newCollectionData.name,
        organization: newCollectionData.organization,
        'product_list[]': newCollectionData.product_list,
        description: newCollectionData.description,
        tags: newCollectionData.tags,
    };
    return pickBy(field, v => v !== undefined);
}

export { getCollectionConstructor, CollectionData };
