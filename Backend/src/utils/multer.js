import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import cloudinary from './cloudinary.js';

const MB = 1024 * 1024;

// File filter — images + videos only
const fileFilter = (req, file, cb) => {
  const allowedImages = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedVideos = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];

  if ([...allowedImages, ...allowedVideos].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WEBP images and MP4/MOV/AVI videos allowed'), false);
  }
};

// Cloudinary storage config
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    return {
      folder        : `complaints/${isVideo ? 'videos' : 'images'}`,
      resource_type : isVideo ? 'video' : 'image',
      allowed_formats: isVideo
        ? ['mp4', 'mov', 'avi']
        : ['jpg', 'jpeg', 'png', 'webp']
    };
  }
});

// Custom size enforcer (multer limits per file type)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * MB } // outer cap — per-type check below
});

// Middleware that enforces 5MB for images, 20MB for videos
export const attachmentUpload = (req, res, next) => {
  upload.array('attachments', 5)(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });

    // Per-file size check after multer runs
    const MB5  = 5  * MB;
    const MB20 = 20 * MB;

    if (req.files) {
      for (const file of req.files) {
        const isVideo = file.mimetype.startsWith('video/');
        const limit   = isVideo ? MB20 : MB5;

        if (file.size > limit) {
          return res.status(400).json({
            message: `${file.originalname} exceeds ${isVideo ? '20MB video' : '5MB image'} limit`
          });
        }
      }
    }
    next();
  });
};