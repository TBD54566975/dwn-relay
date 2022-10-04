import cluster from 'node:cluster';

import config from './config';

import { app } from './app';
import { Server } from './server';

const { numProcesses } = config.relay;

if (cluster.isPrimary) {
  // create DID if not exists

  console.log(`[pid:${process.pid}] Primary - Forking ${numProcesses} processes`);

  // event handler that is triggered whenever a worker processor exits
  cluster.on('exit', (worker, code, signal) => {
    console.log(`[pid:${process.pid}] Primary - pid:${worker.process.pid} died with code ${code}`);
  });

  for (let i = 0; i < numProcesses; i += 1) {
    cluster.fork();
  }
} else {
  const server = new Server(app);
  
  server.listen(9000, () => {
    console.log('server listening on port 9000');
  });
}