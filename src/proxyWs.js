import httpProxy from 'http-proxy';

export default (app, server, wsHost, wsPort) => {
    const socketServerUrl = `http://${wsHost}:${wsPort}`;
    const wsProxy = httpProxy.createProxyServer({
      target: socketServerUrl,
      ws: true
    });
    app.use('/ws', (req, res) => {
      wsProxy.web(req, res, {target: socketServerUrl + '/ws'});
    });
    server.on('upgrade', (req, socket, head) => {
      wsProxy.ws(req, socket, head);
    });
    
    // added the error handling to avoid https://github.com/nodejitsu/node-http-proxy/issues/527
    wsProxy.on('error', (error, req, res) => {
      let json;
      if (error.code !== 'ECONNRESET') {
        console.error('proxy error', error);
      }
      if (!res.headersSent) {
        res.writeHead(500, {'content-type': 'application/json'});
      }
  
      json = {error: 'proxy_error', reason: error.message};
      res.end(JSON.stringify(json));
    });
};