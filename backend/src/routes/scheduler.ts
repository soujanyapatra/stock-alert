import { Router } from 'express';
import { runScheduler } from '../controllers/scheduler';

const router = Router();

router.post('/run', runScheduler);

export default router;
