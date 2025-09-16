import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'IAM Automation API endpoints' });
});

export { router as iamAutomationRoutes };
