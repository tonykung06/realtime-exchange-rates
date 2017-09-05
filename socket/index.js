import express from 'express';
import config from '../src/config';
import http from 'http';
import SocketIo from 'socket.io';
import {paramCase} from 'change-case';

const requiredEnvVariables = [
  'REDIS_HOST',
  'REDIS_PORT',
  'SOCKET_PORT'
];

if (requiredEnvVariables.some(v => !process.env[v])) {
  console.error(`
    Please make sure you have configured all required env variables ${requiredEnvVariables.join(',')},
    details: ${requiredEnvVariables.reduce((accumulator, current) => `${accumulator}${current}: ${process.env[current]}, `, '')}
  `);
  process.exit(1);
}

const app = express();
const server = new http.Server(app);
const io = new SocketIo(server);
io.adapter(require('socket.io-redis')({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
}));
io.path('/ws');

const runnable = app.listen(process.env.SOCKET_PORT, (err) => {
  if (err) {
    console.error(err);
  }
  console.info('----\n==> 🌎  SOCKETIO is running on port %s', process.env.SOCKET_PORT);
  console.info('==> 💻  Send requests to http://:%s/ws', process.env.SOCKET_PORT);
});

io.on('connection', (socket) => {
  console.log(`a client is connected, id: ${socket.id}`);
  socket.emit('news', {msg: `'Hello World!' from socket server`});
});
io.listen(runnable);
