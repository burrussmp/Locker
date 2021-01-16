/* eslint-disable max-len */
/* eslint-disable import/no-named-as-default-member */
'use strict';

import CollectionBasic from '@test/CollectionTests/collection.basic.test';
import CollectionSpecific from '@test/CollectionTests/collection.specific.test';

const collectionTests = () => {
  // describe('PATH: /api/collections', CollectionBasic);
  describe('PATH: /api/collections/:collectionId', CollectionSpecific);
};

export default collectionTests;
