/* eslint-disable max-len */
'use strict';

import getPixels from 'get-pixels';
import {encode} from 'blurhash';
const {JSDOM} = require('jsdom');
global.document = new JSDOM().window.document;

/**
 * @desc Encode a data URI or a
 * @param {string | Buffer} data : Either a string (Data URI) or the buffer
 * @param {String} mimeType : The blurhash mimetype e.g. image/png
 * @return {Promise<String, Error>} Returns a string for the blur hashed image in
 * 'data' else returns an error
 */
const encodeBlurHash = async (data, mimeType) => {
  if (Buffer.isBuffer(data)) {
    data = `data:${mimeType};base64,${data.toString('base64')}`;
  }
  return new Promise((resolve, reject) => {
    getPixels(data, (err, pixels) => {
      if (err) {
        reject(err);
      } else {
        const imageData = pixels.data;
        const width = pixels.shape[0];
        const height = pixels.shape[1];
        // const channels = pixels.shape[2];
        try {
          const blurHash = encode(imageData, width, height, 3, 4);
          resolve(blurHash);
        } catch (err) {
          reject(err);
        }
      }
    });
  });
};

export default {
  encodeBlurHash,
};
