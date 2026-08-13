import healthCheckUp from '../controller/healthCheck.controller.js';
import { Router } from 'express';

const router = Router();

router.route('/healthcheck').post(healthCheckUp);
export default router;
