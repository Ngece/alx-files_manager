// Import necessary modules
const { v4: uuidv4 } = require('uuid'); // Import UUID library
const RedisClient = require('../utils/redis');
const db = require('../utils/db');

class AuthController {
  static async getConnect(req, res) {
    try {
      // Extract the Basic Authentication header
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Basic ')) {
        // If the header is missing or not in the correct format
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Extract and decode the Base64 credentials
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');

      // Split the credentials into email and password
      const [email, password] = credentials.split(':');

      // Implement logic to check if the user exists and the password is correct
      // You can use your database (MongoDB) to perform this check
      // Example:
      const user = await db.getUserByEmailAndPassword(email, password);

      if (!user) {
        // If user not found or password is incorrect
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Generate a random token (e.g., UUID) to identify the user
      const token = uuidv4(); // Use UUID for token generation

      // Store the token in Redis with a TTL (time-to-live)
      await RedisClient.set(`auth_${token}`, user.id, 86400); // 24 hours

      // Return the token in the response
      return res.status(200).json({ token });
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  static async getDisconnect(req, res) {
    try {
      // Extract the token from the request headers
      const token = req.headers['x-token'];

      if (!token) {
        // If the token is missing
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Check if the token is valid by querying Redis
      const userId = await RedisClient.get(`auth_${token}`);

      if (!userId) {
        // If the token is invalid or expired
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Delete the token from Redis
      await RedisClient.del(`auth_${token}`);

      // Return a success response
      return res.status(204).send();
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}

module.exports = AuthController;
