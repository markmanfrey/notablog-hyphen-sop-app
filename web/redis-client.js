const Redis = require('ioredis');
const { spawn } = require('child_process');

const redisServer = spawn('redis-server'); 
let redis;

redisServer.stderr.on('data', (data) => {
    console.error(`Redis server error: ${data}`);
  });
  
  // Listen for ready message
  redisServer.stdout.on('data', (data) => {
    if (data.includes('Ready to accept connections')) {
      startApp(); 
    }
  });
function startApp() {

redis = new Redis({
    host: '127.0.0.1', 
    port: 6379,
    pool: true
  });
}

module.exports = redis;