import { Router } from 'express';
import QuranController from '../controllers/quranController';

const router = Router();

/**
 * @route GET /api/quran/embeddings
 * @desc Generate and store embeddings for Quran data
 * @access Public
 */
router.get('/embeddings', QuranController.generateEmbeddings);

/**
 * @route POST /api/quran/query
 * @desc Query Quran data using semantic search
 * @access Public
 */
router.post('/query', QuranController.queryQuran);

/**
 * @route GET /api/quran/test
 * @desc Test API
 * @access Public
 */
router.get('/test', QuranController.testApi);

export default router;