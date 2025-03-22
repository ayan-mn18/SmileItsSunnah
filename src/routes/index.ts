import quranRoutes from './quranRoutes';
import { Router } from 'express';

const router = Router();

router.use('/quran', quranRoutes);

export default router;