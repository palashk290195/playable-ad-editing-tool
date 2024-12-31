// server/routes/build.js
import express from 'express';
import { buildAd } from '../controllers/buildController.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Validation middleware
const validateBuildRequest = [
  body('network')
    .isString()
    .isIn(['google', 'meta', 'mintegral', 'tiktok', 'ironsource', 'vungle', 'unityads', 'applovin', 'adcolony', 'kayzen'])
    .withMessage('Invalid network specified'),
  body('buildType')
    .isString()
    .isIn(['split', 'inline'])
    .withMessage('Invalid build type'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Build route
router.post('/build', validateBuildRequest, buildAd);

export default router;