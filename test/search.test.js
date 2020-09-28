"use strict";

import SearchUsersTests from './SearchTests/Search.Users';
const search_tests = () => {
    describe("PATH: '/api/search/users'", SearchUsersTests);
}

export default search_tests;