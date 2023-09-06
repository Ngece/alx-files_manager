const chai = require('chai');

const expect = chai.expect;
const DBClient = require('../utils/db');

describe('DBClient', () => {
    let db;
  
    before(() => {
      db = new DBClient();
    });
  
    it('should connect to MongoDB successfully', () => {
      expect(db.isAlive()).to.be.true;
    });
  
    it('should return the number of users in the database', async () => {
      const numUsers = await db.nbUsers();
      expect(numUsers).to.be.a('number');
    });
  
    it('should return the number of files in the database', async () => {
      const numFiles = await db.nbFiles();
      expect(numFiles).to.be.a('number');
    });
  
    it('should return a user by email and password', async () => {
      const email = 'test@example.com';
      const password = 'testpassword';
  
      const user = await db.getUserByEmailAndPassword(email, password);
      expect(user).to.be.an('object');
      expect(user.email).to.equal(email);
    });
  });
  