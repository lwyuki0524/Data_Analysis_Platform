import express from 'express';
import * as dashboardController from '../controllers/dashboardController';

const router = express.Router();

router.post('/', dashboardController.createDashboard);
router.get('/', dashboardController.getDashboards);
router.get('/latest', dashboardController.getLatestDashboard);
router.get('/:id', dashboardController.getDashboard);
router.put('/:id', dashboardController.updateDashboard);
router.delete('/:id', dashboardController.deleteDashboard);

export default router;
