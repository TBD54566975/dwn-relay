import cluster from 'node:cluster';
import os from 'node:os';
import process from 'node:process';


import { app } from './app.js';
import { Server } from './server.js';

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`[pid:${process.pid}] Primary - Forking ${numCPUs} processes`);

  // event handler that is triggered whenever a worker processor exits
  cluster.on('exit', (worker, code, signal) => {
    console.log(`[pid:${process.pid}] Primary - pid:${worker.process.pid} died with code ${code}`);
  });

  for (let i = 0; i < numCPUs; i += 1) {
    cluster.fork();
  }
} else {
  const server = new Server(app);
  
  server.listen(9000, () => {
    console.log('server listening on port 9000');
  });
}