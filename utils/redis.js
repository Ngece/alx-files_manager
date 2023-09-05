// Redis client module
const redis = require('redis');

class RedisClient {
    constructor() {
      // Redis client and handle any errors
      this.client = redis.createClient();
      this.getAsync = promisify(this.client.get).bind(this.client);
      this.client.on('error', (error) => {
        console.error('Redis client error:', error);
      });
    }
  
    async isAlive() {
      // Checks if the Redis client is connected
      return this.client.connected;
    }
  
    async get(key) {
      // retrieves a value from Redis
      const value = await this.client.get(key);
        return value;
    }
  
    async set(key, value, duration) {
      // stores a value in Redis with an expiration
      const result = await this.client.set(key, value, 'EX', duration);
        return result;
    }
  
    async del(key) {
      // deletes a value from Redis
        await this.client.del(key);
    }
  }
  
  // Exporting an instance of the RedisClient class
  module.exports = new RedisClient();
  