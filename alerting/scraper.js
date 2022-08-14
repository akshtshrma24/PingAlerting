const exec = require('exec');

const client = require('prom-client');
const express = require('express');

const logger = require('../util/logger');
const snmpwalk = require('./snmp.js');
const ping = require('./ping.js');

console.log(snmpwalk)
console.log(ping)

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
  
const snmpMetric = new client.Gauge({
    name: "last_snmp_response",
    help: "The last time the device responded to snmpwalk",
    labelNames: ['ipAddress', 'deviceName'],
});
const snmpLatency = new client.Gauge({
    name: "snmp_latency",
    help: "Latency of our snmp requests",
    labelNames: ['ipAddress', 'deviceName'],
});
const pingLatency = new client.Gauge({
    name: "ping_latency_ms",
    help: "Latency of our ping requests",
    labelNames: ['ipAddress', 'deviceName'],
});

  
register.registerMetric(pingingMetric);
register.registerMetric(snmpMetric);
register.registerMetric(pingLatency);
register.registerMetric(snmpLatency);

register.setDefaultLabels ({
    app: 'ping'
});
client.collectDefaultMetrics({ register });

app.get('/metrics', async (request, response) => {
    response.setHeader('Content-Type', register.contentType);
    response.end(await register.metrics());
});

app.listen(metricsPort, () =>{
  logger.info(`Started server on port ${metricsPort}`);
});


devices.forEach(({ip, name, snmp}) => {
    pingingMetric.labels(ip, name).set(Date.now())
    if(snmp) snmpMetric.labels(ip,name).set(Date.now())
});


setInterval(async () => {
  devices.forEach(async ({ip, name, snmp}) => {
    let timer = Date.now();
    pingCheck = await ping.checkIfDeviceUp(ip)
    pingLatency.labels(ip,name).set(Date.now() - timer)
    if(pingCheck){
        pingingMetric.labels(ip, name).set(Date.now())
    }
    if(snmp){
        timer = Date.now();
        snmpCheck = await snmpwalk.checkSNMP(ip)
        snmpLatency.labels(ip,name).set(Date.now() - timer)
        if(snmpCheck) snmpMetric.labels(ip, name).set(Date.now())
    }
});
}, scrapeIntervalSeconds * 1000);
  