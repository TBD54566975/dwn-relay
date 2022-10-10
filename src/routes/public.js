import express from 'express';
import dwnHandler from '../request-handlers/dwn-handler';

const publicRouter = express.Router();

publicRouter.post('/', dwnHandler);

export default publicRouter;