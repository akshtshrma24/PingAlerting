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

async function checkIfDeviceUp(ip) {
  const result = await this.executePingCommand(ip);
  if(result) return true
  return false
}

module.exports = { checkIfDeviceUp, executePingCommand}