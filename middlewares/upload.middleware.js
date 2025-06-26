const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME, // Click 'View API Keys' above to copy your cloud name
  api_key: process.env.CLOUDINARY_KEY, // Click 'View API Keys' above to copy your API key
  api_secret: process.env.CLOUDINARY_SECRET, // Click 'View API Keys' above to copy your API secret
});
