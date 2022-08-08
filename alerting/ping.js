const { logger } = require('../util/logger');
const exec = require('exec');
const client = require('prom-client');
const express = require('express');
const app = express();
let register = new client.Registry();

const printerIPs = [
    {
        name: '----',
        ip: 'xxx.xxx.xxx.xxx'
    },
    {
        name: '----',
        ip: 'xxx.xxx.xxx.xxx'
    },
];
let pingMonitoring = {};

const akshit = new client.Gauge({
    name: "have_you_ever_been",
    help: "to a park and you saw a cat",
    labelNames: ['ipAddress', 'deviceName'],
});

register.registerMetric(akshit);

// printerIPs.forEach(({name, ip}) => {
//     akshit.labels('8.8.8.8', 'goggle dns').inc()
//     akshit.labels('151.101.66.49', 'cool math gamez').inc()
// })

function pingIP(ip,name) {
    return new Promise((resolve) => {
        try{
            exec(`ping -c 5 ${ip}`, (error, stdout, stderr) => {
                if(error){
                    // logger.error(`error: ${error.message}`);
                    akshit.labels(ip, name).set(0)
                    resolve(false);
                }
                if(stderr){
                    // logger.error(`error: ${error.message}`);
                    akshit.labels(ip, name).set(0)
                    resolve(false);
                } 
                else if (stdout){                    
                    akshit.labels(ip, name).set(1)
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
    printerIPs.forEach(({name, ip}) => {
        pingIP(ip,name)
    })
}, 1000);
