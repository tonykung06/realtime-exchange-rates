import express from 'express';
import config from '../src/config';
import http from 'http';
import SocketIo from 'socket.io';
import {paramCase} from 'change-case';

const app = express();
const server = new http.Server(app);
const io = new SocketIo(server);
io.adapter(require('socket.io-redis')({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
}));
io.path('/ws');

if (config.socketPort) {
  const runnable = app.listen(config.socketPort, (err) => {
    if (err) {
      console.error(err);
    }
    console.info('----\n==> 🌎  SOCKETIO is running on port %s', config.socketPort);
    console.info('==> 💻  Send requests to http://%s:%s/ws', config.apiHost, config.socketPort);
  });

  io.on('connection', (socket) => {
    socket.emit('news', {msg: `'Hello World!' from socket server`});
  });
  io.listen(runnable);
} else {
  console.error('==>     ERROR: No SOCKET_PORT environment variable has been specified');
}
