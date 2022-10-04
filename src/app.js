import cors from 'cors';
import bodyParser from 'body-parser';
import express from 'express';

export const app = express();

app.use(cors());
app.use(bodyParser.json());

app.post('/', (req, res) => {
  return res.status(501).json({ errors: [{ error: 'Not Implemented.' }] });
});

