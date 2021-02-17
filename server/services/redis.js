/**
 * @desc Utilities for Redis
 */

import mongoose from 'mongoose';
import redis from 'redis';
import util from 'util';

import config from '@config/config';

// create redis client
const client = redis.createClient(config.redis.url);
client.hget = util.promisify(client.hget);

// create reference for .exec
const exec = mongoose.Query.prototype.exec;

// create new cache function on prototype
mongoose.Query.prototype.cache = function(options = { expire: 60 }) {
  this.useCache = true;
  this.expire = options.expire;
  this.hashKey = JSON.stringify(options.key || this.mongooseCollection.name);

  return this;
}

// override exec function to first check cache for data
mongoose.Query.prototype.exec = async function() {
  if (!this.useCache) {
    return await exec.apply(this, arguments);
  }

  const key = JSON.stringify({
    ...this.getFilter(),
    collection: this.mongooseCollection.name
  });

  // get cached value from redis
  const cacheValue = await client.hget(this.hashKey, key);

  // if cache value is not found, fetch data from mongodb and cache it
  if (!cacheValue) {
    const result = await exec.apply(this, arguments);
    client.hset(this.hashKey, key, JSON.stringify(result));
    client.expire(this.hashKey, this.expire);

    console.log('Return data from MongoDB');
    return result;
  }

  // return found cachedValue
  const doc = JSON.parse(cacheValue);
  return Array.isArray(doc) ? doc.map(d => new this.model(d)) : new this.model(doc);
};

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  }
}
