'use strict';

import SearchUsersTests from './search.users.test';

const searchTests = () => {
  describe('PATH: \'/api/search/users\'', SearchUsersTests);
};

export default searchTests;
