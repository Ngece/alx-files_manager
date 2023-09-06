// Import necessary modules
const fs = require('fs');
const path = require('path');
const mimeTypes = require('mime-types');
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

  static async getShow(req, res) {
    try {
      // Extract user information from the request, including user ID and token
      const userId = req.user.id;

      // Extract file ID from the request parameters
      const fileId = req.params.id;

      // Check if the file exists and is accessible by the user
      const file = await db.getFileById(fileId);

      if (!file || (file.userId !== userId && !file.isPublic)) {
        return res.status(404).json({ message: 'File not found' });
      }

      if (file.type === 'folder') {
        return res.status(400).json({ message: 'A folder doesn\'t have content' });
      }

      // Get the MIME-type based on the file's name
      const mimeType = mimeTypes.lookup(file.name);

      // Determine the file path (local storage)
      const filePath = file.localPath;

      // Check if the file is not locally present
      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found' });
      }

      // Return the file content with the correct MIME-type
      res.setHeader('Content-Type', mimeType);
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      return null;
    } catch (error) {
      console.error('Get file error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  static async getIndex(req, res) {
    try {
      // Extract user information from the request, including user ID and token
      const userId = req.user.id;

      // Extract query parameters for pagination (page)
      const page = parseInt(req.query.page, 10) || 0;
      const pageSize = 20; // Number of items per page

      // Query files based on user ID, with pagination
      const files = await db.getFilesByUserId(userId, page, pageSize);

      // Return the list of files
      res.status(200).json(files);
      return null;
    } catch (error) {
      console.error('List files error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  static async putPublish(req, res) {
    try {
      // Extract user information from the request, including user ID and token
      const userId = req.user.id;

      // Extract file ID from the request parameters
      const fileId = req.params.id;

      // Check if the file exists and is accessible by the user
      const file = await db.getFileById(fileId);

      if (!file || file.userId !== userId) {
        return res.status(404).json({ message: 'File not found' });
      }

      // Set the file as public
      file.isPublic = true;

      // Update the file in the database
      await db.updateFile(file);

      // Return the updated file
      res.status(200).json(file);
      return null;
    } catch (error) {
      console.error('Publish file error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  static async putUnpublish(req, res) {
    try {
      // Extract user information from the request, including user ID and token
      const userId = req.user.id;

      // Extract file ID from the request parameters
      const fileId = req.params.id;

      // Check if the file exists and is accessible by the user
      const file = await db.getFileById(fileId);

      if (!file || file.userId !== userId) {
        return res.status(404).json({ message: 'File not found' });
      }

      // Set the file as not public
      file.isPublic = false;

      // Update the file in the database
      await db.updateFile(file);

      // Return the updated file
      res.status(200).json(file);
      return null;
    } catch (error) {
      console.error('Unpublish file error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}

module.exports = FilesController;
