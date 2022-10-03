/**
 * a simple wrapper for express apps that provides graceful shutdown
 */
export class Server {
  constructor(app, keepAliveTimeoutMillis, headersTimeoutMillis) {
    this.app = app;
    this.sockets = {};
    this.socketId = 1;
    this.http = undefined;
    this.stopping = false;
    this.keepAliveTimeoutMillis = keepAliveTimeoutMillis;
    this.headersTimeoutMillis = headersTimeoutMillis;
  }

  listen(port, callback) {
    this.http = this.app.listen(port, callback);

    if (this.keepAliveTimeoutMillis) {
      this.http.keepAliveTimeout = this.keepAliveTimeoutMillis;
    }

    if (this.headersTimeoutMillis) {
      this.http.headersTimeout = this.headersTimeoutMillis;
    }

    // This event is emitted when a new TCP stream is established
    this.http.on('connection', socket => {
      // set socket to idle. this same socket will be accessible within the `http.on('request', (req, res))` event listener
      // as `request.connection`
      socket.__idle = true;
      const socketId = this.socketId++;
      this.sockets[socketId] = socket;
      // This event is emitted when a tcp stream is `destroy`ed
      socket.on('close', () => {
        delete this.sockets[socketId];
      });
    });

    // Emitted each time there is a request. There may be multiple requests
    // per connection (in the case of HTTP Keep-Alive connections).
    this.http.on('request', (request, response) => {
      const { connection: socket } = request;

      // set __idle to false because this socket is being used for an incoming request
      socket.__idle = false;

      // Emitted when the response has been sent. More specifically, this event is emitted
      // when the last segment of the response headers and body have been handed off to the
      // operating system for transmission over the network.
      // It does not imply that the client has received anything yet.
      response.on('finish', () => {
        // set __idle back to true because the socket has finished facilitating a request. This socket may be used again without being
        // destroyed if keep-alive is being leveraged
        socket.__idle = true;
        if (this.stopping) {
          socket.destroy();
        }
      });
    });
  }

  stop(callback) {
    this.stopping = true;
    // Stops the server from accepting new connections and keeps existing connections. This function is asynchronous,
    // the server is finally closed when all connections are ended and the server emits a 'close' event.
    // The optional callback will be called once the 'close' event occurs. Unlike that event, it will be
    // called with an Error as its only argument if the server was not open when it was closed.
    this.http.close(() => {
      this.socketId = 0;
      this.stopping = false;
      callback();
    });

    // close all idle sockets. the remaining sockets facilitating active requests
    // will be closed after they've served responses back.
    for (let socketId in this.sockets) {
      const socket = this.sockets[socketId];
      if (socket.__idle) {
        socket.destroy();
      }
    }
  }
}