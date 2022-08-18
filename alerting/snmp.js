const exec = require('exec');

const logger = require('../util/logger');
const {
    devices,
    scrapeIntervalSeconds,
    metricsPort,
    packetCount,
} = require('../config/config.json');

function executeSNMPCommand(ip) {
    return new Promise((resolve) => {
        exec(`snmpwalk -v1 -c public ${ip}`, (error, stdout, stderr) => {
            if(error || stderr) {
            logger.error(`Unable to do snmp ${ip}: \n`, {error, stderr, stdout})
            return resolve(false);
            }
            return resolve(true);
        });
    });
}

module.exports = { executeSNMPCommand };