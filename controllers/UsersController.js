// Import necessary modules
const sha1 = require('sha1');
const db = require('../utils/db');

class UsersController {
  static async postNew(req, res) {
    try {
      // Extract email and password from the request body
      const { email, password } = req.body;

      // Check if email and password are provided
      if (!email) {
        return res.status(400).json({ message: 'Missing email' });
      }

      if (!password) {
        return res.status(400).json({ message: 'Missing password' });
      }

      // Check if the email already exists in the database
      const existingUser = await db.getUserByEmail(email);

      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      // Hash the password using SHA1
      const hashedPassword = sha1(password);

      // Create a new user object
      const newUser = {
        email,
        password: hashedPassword,
      };

      // Insert the new user into the database
      const insertedUser = await db.createUser(newUser);

      // Return the new user with only the email and ID
      return res.status(201).json({ email: insertedUser.email, id: insertedUser._id });
    } catch (error) {
      console.error('User creation error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}

module.exports = UsersController;
