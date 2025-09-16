import { Router } from 'express';
const router = Router();

// Placeholder routes - add actual implementations as needed
router.get('/', (req, res) => {
  res.json({ message: 'AWS IAM API endpoints' });
});

export { router as awsRoutes };
