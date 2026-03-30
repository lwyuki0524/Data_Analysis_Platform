import express from 'express';
import * as dashboardController from '../controllers/dashboardController';

const router = express.Router();

router.post('/generate', dashboardController.generateDashboard);
router.get('/latest', dashboardController.getLatestDashboard);
router.get('/:id', dashboardController.getDashboard);

export default router;
