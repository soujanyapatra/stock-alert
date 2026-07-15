import { Router } from 'express';
import { getProductDetails, checkProduct } from '../controllers/product';

const router = Router();

router.get('/:id', getProductDetails);
router.post('/check', checkProduct);

export default router;
