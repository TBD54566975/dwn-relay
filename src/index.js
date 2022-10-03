import cluster from 'cluster';

import { app } from './app.js';
import { Server } from './server.js';

const server = new Server(app);

server.listen(9000, () => {
  console.log('server listening on port 9000');
});


