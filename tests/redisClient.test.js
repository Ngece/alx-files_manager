const chai = require('chai');
const expect = chai.expect;
const RedisClient = require('../utils/redis');

describe('RedisClient', () => {
  let redis;

  before(() => {
    redis = new RedisClient();
  });

  it('should connect to Redis successfully', async () => {
    const isAlive = await redis.isAlive();
    expect(isAlive).to.be.true; // Assertion here
  });

  it('should set and get a value in Redis', async () => {
    const key = 'testKey';
    const value = 'testValue';
    const duration = 3600; // 1 hour

    await redis.set(key, value, duration);
    const retrievedValue = await redis.get(key);

    expect(retrievedValue).to.equal(value); // Assertion here
  });

  it('should delete a value from Redis', async () => {
    const key = 'testKey';

    await redis.del(key);
    const retrievedValue = await redis.get(key);

    expect(retrievedValue).to.be.null; 
  });
});
