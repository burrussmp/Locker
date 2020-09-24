"use strict";

import getPixels from "get-pixels";
import { encode } from "blurhash";
const { JSDOM } = require('jsdom');
global.document = new JSDOM().window.document;

/**
 * @desc Encode a data URI or a
 * @param {string | Buffer} data : Either a string (Data URI) or the buffer
 */
const encodeBlurHash = async (data, type) => {
  if (Buffer.isBuffer(data)) {
    data = `data:${type};base64,${data.toString("base64")}`;
  }
  return new Promise((resolve, reject) => {
    getPixels(data, (err, pixels) => {
      if (err) {
        reject(err);
      } else {
        const image_data = pixels.data;
        const width = pixels.shape[0];
        const height = pixels.shape[1];
        const channels = pixels.shape[2];
        try {
          const blur_hash = encode(image_data, width, height, 4, 3);
          resolve(blur_hash);
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
