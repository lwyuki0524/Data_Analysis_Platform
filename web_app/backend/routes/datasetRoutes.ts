import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as datasetController from '../controllers/datasetController';

const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

router.post('/upload', upload.single('file'), datasetController.uploadDataset);
router.get('/', datasetController.getDatasets);
router.get('/:id', datasetController.getDatasetById);
router.delete('/:id', datasetController.deleteDataset);

export default router;
