import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'Terraform API endpoints' });
});

export { router as terraformRoutes };
