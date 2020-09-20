"use strict";

import MediaTestBasics from './Media/media.test';

const all_media_tests = () => {
    describe("PATH: '/api/media'", MediaTestBasics);
}

export default all_media_tests;