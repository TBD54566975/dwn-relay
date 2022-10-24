import cors from 'cors';
import express from 'express';

import publicHandler from './routes/public';

const app = express();

app.use(cors());
app.use(express.raw({ type: '*/*' }));

app.use('/', publicHandler);


export default app;