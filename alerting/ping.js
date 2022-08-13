const exec = require('exec');

const client = require('prom-client');
const express = require('express');

const logger = require('../util/logger');
const {
  devices,
  scrapeIntervalSeconds,
  metricsPort,
  packetCount,
} = require('../config/config.json');

logger.info('Starting ping scraper with options', {
  scrapeIntervalSeconds,
  metricsPort,
  packetCount,
});

const app = express();
let register = new client.Registry();

const pingingMetric = new client.Gauge({
    name: "device_last_seen",
    help: "The last time a device was seen. Is set to the current time a device was seen",
    labelNames: ['ipAddress', 'deviceName'],
});

register.registerMetric(pingingMetric);
register.setDefaultLabels ({
  app: 'ping'
});
client.collectDefaultMetrics({ register });

function executePingCommand(ip) {
  return new Promise((resolve) => {
    exec(`ping -c ${packetCount} ${ip}`, (error, stdout, stderr) => {
      if(error || stderr) {
        logger.error(`Unable to ping ${ip}: \n`, {error, stderr, stdout})
        return resolve(false);
      }
      return resolve(true);
    });
  });
}

async function checkIfDeviceUp(ip, name) {
  const result = await executePingCommand(ip);
  if (result) {
    pingingMetric.labels(ip, name).set(Date.now())
  }
}
  
app.get('/metrics', async (request, response) => {
    response.setHeader('Content-Type', register.contentType);
    response.end(await register.metrics());
});
  
app.listen(metricsPort, () =>{
    logger.info(`Started server on port ${metricsPort}`);
});

devices.forEach(({ip, name}) => {
  pingingMetric.labels(ip, name).set(Date.now())
});

setInterval(async () => {
    devices.forEach(({ip, name}) => {
      checkIfDeviceUp(ip, name);
  });
}, scrapeIntervalSeconds * 1000);
