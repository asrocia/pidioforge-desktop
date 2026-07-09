const http = require('http');
http.createServer((req,res)=>res.end('ok')).listen(8899,'127.0.0.1',()=>console.log('mini-listen'));
