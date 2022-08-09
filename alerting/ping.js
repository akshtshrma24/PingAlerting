const { logger } = require('../util/logger');
const exec = require('exec');
const client = require('prom-client');
const express = require('express');
const app = express();
let register = new client.Registry();

const rawArgs = process.argv.slice(2);
let IPStemp = [];
let names= [];

for (let i = 0; i < rawArgs.length; i += 2) {
    switch (rawArgs[i]) {
      case '--ips':
        IPStemp[0] = rawArgs[i + 1].replace(/["']/g, '');
        if(rawArgs[i + 1].includes(','))
        {
          for(let j  = 0; j < rawArgs[i + 1].split(',').length; j++)
          {
            IPStemp[j] = rawArgs[i + 1].split(',')[j].replace(/["']/g, '');
          }
        }
        break;
      case '--names':
        names[0] = rawArgs[i + 1].replace(/["']/g, '');
        if(rawArgs[i + 1].includes(','))
        {
          for(let j  = 0; j < rawArgs[i + 1].split(',').length; j++)
          {
            names[j] = rawArgs[i + 1].split(',')[j].replace(/["']/g, '');
          }
        }
        break;
      default:
        return "ping.js --ips <ips> --names<names>";
    }
  }

let IPs = Object.assign.apply({}, names.map( (v, i) => ( {[v]: IPStemp[i]} ) ) );
let pingMonitoring = {};

const akshit = new client.Gauge({
    name: "have_you_ever_been",
    help: "to a park and you saw a cat",
    labelNames: ['ipAddress', 'deviceName'],
});

register.registerMetric(akshit);

function pingIP(ip,name) {
    return new Promise((resolve) => {
        try{
            exec(`ping -c 5 ${ip}`, (error, stdout, stderr) => {
                if(error){
                    console.log("setting to 0 for ", ip)
                    akshit.labels(ip, name).set(0)
                    resolve(false);
                }
                if(stderr){
                    console.log("setting to 0 for ", ip)
                    akshit.labels(ip, name).set(0)
                    resolve(false);
                } 
                else if (stdout){                  
                    console.log("setting to 1 for ", ip)
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
    Object.keys(IPs).forEach(key => {
        let address = IPs[key];
        pingIP(address,key)
    })
}, 1000);
