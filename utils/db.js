// Mongo db client module
const { MongoClient } = require('mongodb');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${DB_HOST}:${DB_PORT}`;

class DBClient {
  // Mongo db client class constructor
  constructor() {
    MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
      if (!err) {
        // connects to the database and stores its client
        this.db = client.db(DB_DATABASE);
        this.users = this.db.collection('users');
        this.files = this.db.collection('files');
      } else {
        console.log(err.message);
        this.db = false;
      }
    });
  }

  // checks if the database is alive
  isAlive() { return !!this.db; }

  // returns the number of users in the database
  async nbUsers() { return this.users.countDocuments(); }

  // returns the number of files in the database
  async nbFiles() { return this.files.countDocuments(); }

  async getUserByEmailAndPassword(email, password) {
    const user = await this.client.db('files_manager').collection('users').findOne({ email, password });
    return user;
  }
}

// exporting instance of the DBClient class
const dbClient = new DBClient();
module.exports = dbClient;
