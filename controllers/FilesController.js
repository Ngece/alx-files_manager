// Import necessary modules
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/db');

class FilesController {
  static async postUpload(req, res) {
    try {
      // Extract user information from the request, including user ID and token
      const userId = req.user.id;

      // Extract file data from the request body
      const {
        name, type, parentId, isPublic, data,
      } = req.body;

      // Check if the required fields are provided
      if (!name) {
        return res.status(400).json({ message: 'Missing name' });
      }

      if (!type) {
        return res.status(400).json({ message: 'Missing type' });
      }

      if (!data && type !== 'folder') {
        return res.status(400).json({ message: 'Missing data' });
      }

      // Check if parentId is provided and valid (if not, default to 0 for root)
      const parent = parentId ? await db.getFileById(parentId) : null;
      if (parentId && !parent) {
        return res.status(400).json({ message: 'Parent not found' });
      }

      // Generate a unique file ID (e.g., UUID)
      const fileId = uuidv4();

      // Define the file path (local storage)
      const storagePath = path.join(__dirname, '..', 'storage');
      const filePath = path.join(storagePath, fileId);

      // Save the file content to the local storage
      if (type !== 'folder') {
        const fileContent = Buffer.from(data, 'base64');
        fs.writeFileSync(filePath, fileContent);
      }

      // Create a new file document to store in the database
      const newFile = {
        _id: fileId,
        userId,
        name,
        type,
        parentId: parentId || '0', // Default to root if parentId is not provided
        isPublic: isPublic || false,
        localPath: type !== 'folder' ? filePath : null,
      };

      // Insert the new file document into the database
      await db.createFile(newFile);

      // Return the newly created file
      return res.status(201).json(newFile);
    } catch (error) {
      console.error('File upload error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}

module.exports = FilesController;
