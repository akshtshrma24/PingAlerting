const exec = require('exec');

const logger = require('../util/logger');
const {
    devices,
    scrapeIntervalSeconds,
    metricsPort,
    packetCount,
} = require('../config/config.json');

class snmp{
    constructor() {}

    executeSNMPCommand(ip) {
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
    
    async checkSNMP(ip, name) {
        const result = await this.executeSNMPCommand(ip);
        logger.warn(result)
        if(result){
            logger.success("GOT SNMP DATA FROM IP: ", ip)
            return true
        }
        return false
    }
}

module.exports = { SNMP };