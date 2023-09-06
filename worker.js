const imageThumbnail = require('image-thumbnail');
const Bull = require('bull');
const path = require('path');
const fs = require('fs');
// Bull queue for sending welcome emails
const welcomeEmailQueue = new Queue('welcomeEmailQueue');
const Queue = require('bull');
const nodemailer = require('nodemailer');
const db = require('./utils/db');

// Bull queue for generating thumbnails
const fileQueue = new Bull('fileQueue', {
  redis: {
    host: 'localhost', // Redis server host
    port: 6379, // Redis server port
  },
});

// Process the queue
fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  async function fetchFile(userId, fileId) {
    // fetch file from the database or storage based on userId and fileId
    const file = await db.getFileById(fileId);

    if (!file || file.userId !== userId) {
      throw new Error('File not found');
    }
    return file;
  }

  // Fetch the file from the database or storage based on userId and fileId
  const file = await fetchFile(userId, fileId);

  if (!file || file.type !== 'image') {
    throw new Error('Invalid file or file type');
  }

  // Generate thumbnails
  const thumbnail500 = await imageThumbnail(file.localPath, { width: 500 });
  const thumbnail250 = await imageThumbnail(file.localPath, { width: 250 });
  const thumbnail100 = await imageThumbnail(file.localPath, { width: 100 });

  function storeThumbnails(fileId, thumbnail500, thumbnail250, thumbnail100) {
    // Define the directory where thumbnails will be stored (e.g., inside a 'thumbnails' folder)
    const thumbnailsDir = path.join(__dirname, 'thumbnails');

    // Ensure the thumbnails directory exists, or create it if it doesn't
    if (!fs.existsSync(thumbnailsDir)) {
      fs.mkdirSync(thumbnailsDir);
    }

    // Generate unique file names for each thumbnail (e.g., based on fileId and thumbnail size)
    const thumbnail500Name = `thumbnail_500_${fileId}.jpg`;
    const thumbnail250Name = `thumbnail_250_${fileId}.jpg`;
    const thumbnail100Name = `thumbnail_100_${fileId}.jpg`;

    // Define the file paths where thumbnails will be stored
    const thumbnail500Path = path.join(thumbnailsDir, thumbnail500Name);
    const thumbnail250Path = path.join(thumbnailsDir, thumbnail250Name);
    const thumbnail100Path = path.join(thumbnailsDir, thumbnail100Name);

    // Write the thumbnail images to their respective paths
    fs.writeFileSync(thumbnail500Path, thumbnail500);
    fs.writeFileSync(thumbnail250Path, thumbnail250);
    fs.writeFileSync(thumbnail100Path, thumbnail100);
  }

  // Call function to store thumbnails
  storeThumbnails(fileId, thumbnail500, thumbnail250, thumbnail100);
});

// Process the queue
welcomeEmailQueue.process(async (job) => {
  const { userId, email } = job.data;

  // Using nodemailer
  const transporter = nodemailer.createTransport({
    service: 'your_email_service_provider', // e.g., 'gmail'
    auth: {
      user: 'your_email@example.com',
      pass: 'your_email_password',
    },
  });

  const mailOptions = {
    from: 'email@example.com',
    to: email,
    subject: 'Welcome to Our App',
    text: 'Welcome to our app! We are excited to have you on board.',
  };

  // Send the email
  await transporter.sendMail(mailOptions);
});

module.exports = welcomeEmailQueue;
module.exports = fileQueue;
