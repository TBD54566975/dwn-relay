import cors from 'cors';
import express from 'express';
import dwn from './dwn';

const app = express();

app.use(cors());
app.use(express.raw({ type: '*/*' }));

app.post('/', async (req, res) => {
  const resp = await dwn.processRequest(req.body);
  const status = resp.status?.code || 200;

  return res.status(status).json(resp);
});


export default app;