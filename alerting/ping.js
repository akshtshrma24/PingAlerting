const { logger } = require('../util/logger');
const exec = require('exec');
const client = require('prom-client');
const express = require('express');
const app = express();
let register = new client.Registry();

const printerIPs = [
    {
        name: 'google_dns',
        ip: '8.8.8.8'
    },
    {
        name: 'some_random_hawaiian_gte_dns',
        ip: '4.4.4.4'
    },
    {
        name: 'cloudflare_dns',
        ip: '1.1.1.1'
    },
    {
        name: 'definitely_not_an_ip_address',
        ip: 'adasdasdafwgfuigwfigw.asdadkhsdh'
    },
];
let pingMonitoring = {};

printerIPs.forEach(({name, ip}) => {
    const gaugeToRegister = new client.Gauge({
        name: `metrics_for_${name}`,
        help: `i_didnt_ruin_your_pizza_i_just_changed_the_cheese ${ip}`,
    });
    pingMonitoring[ip] = gaugeToRegister
    register.registerMetric(gaugeToRegister);
})

function pingIP(ipAddress) {
    return new Promise((resolve) => {
        try{
            exec(`ping -c 5 ${ipAddress}`, (error, stdout, stderr) => {
                if(error){
                    // logger.error(`error: ${error.message}`);
                    pingMonitoring[ipAddress].set(0)                    
                    resolve(false);
                }
                if(stderr){
                    // logger.error(`error: ${error.message}`);
                    pingMonitoring[ipAddress].set(0)                    
                    resolve(false);
                } 
                else if (stdout){                    
                    pingMonitoring[ipAddress].set(1)
                    resolve(true);
                }
            });
        } catch(error){
            logger.error('function had an error: ', error);
            resolve(false);
        }
    });

}

register.setDefaultLabels ({
    app: 'ping-temp'
});
client.collectDefaultMetrics({ register });

app.get('/metrics', async (request, response) => {
    response.setHeader('Content-Type', register.contentType);
    response.end(await register.metrics());
});
  
app.listen(5000, () =>{
    console.log('Started server on port 5000');
});


setTimeout(() => {
    printerIPs.forEach(({ip}) => {
        pingIP(ip);
    })
}, 1000);
