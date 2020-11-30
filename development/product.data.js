/* eslint-disable max-len */
const ProductData = [
  {
    'name': 'Alo x Logan Hollowell Intention Star Bracelet',
    'url': 'https://www.aloyoga.com/products/jlh0003-intention-star-bracelet-14k-yellow-gold-moonstone',
    'price': 315.0,
    'media': process.cwd() + '/test/resources/product_assets/intention_star.jpg',
    'description': 'Wear a reminder on your wrist to live in alignment with your intentions. The Intention Star Bracelet in solid 14k gold has a bright, hand-selected moonstone. Moonstone is said to enhance intuition and offer protection. 100% Recycled, 14k gold with hand-picked, ethically sourced moonstone Adjustable length: 6.5\u201d (16.5cm',
    'sizes': [],
    'tags': ['golden', 'discount'],
    'all_media': [
      process.cwd() + '/test/resources/product_assets/intention_star2.jpg',
    ],
    'product_collection': 'books',
    'meta': {
      'price_range': 'expensive',
      'interest': 'high',
      'quality': 'low',
    },
  }, {
    'name': 'Mason Core Rib Tank',
    'url': 'https://www.michaellaurenclothing.com/collections/tanks/products/mason-basic-rib-tank',
    'price': 46.0,
    'media': process.cwd() + '/test/resources/product_assets/mason_core_rib_tank.jpg',
    'description': 'Women\'s Mason Basic Rib Tank by Michael Lauren. Made in Los Angeles. Shop designer tank tops for women at michaellaurenclothing.com and enjoy Free US Shipping!',
    'sizes': ['s', 'm', 'l'],
    'tags': ['tag1', 'tag2', 'tag3'],
    'all_media': [
      process.cwd() + '/test/resources/product_assets/mason_core_rib_tank2.jpg',
    ],
    'product_collection': 'tanks',
    'meta': {},
  }, {
    type: 'ProductPost',
    price: 99.99,
    caption: 'The third and final product',
    tags: [],
  },
];

const getProductConstructor = (productData) => {
  return {
    name: productData.name,
    url: productData.url,
    organization: productData.organization,
    price: productData.price,
    description: productData.description,
    sizes: productData.sizes,
    tags: productData.tags,
    product_collection: productData.product_collection,
    meta: JSON.stringify(productData.meta),
  };
};

export {
  ProductData,
  getProductConstructor,
};
