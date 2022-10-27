import app from './app';
import { Server } from './server';

const server = new Server(app);

server.listen(9000, () => {
  console.log('server listening on port 9000');
});
 