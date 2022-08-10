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

const akshit = new client.Gauge({
    name: "DeviceDown",
    help: "device is down",
    labelNames: ['ipAddress', 'deviceName'],
});

register.registerMetric(akshit);

function pingIP(ip,name) {
  let timer = Date.now()
    return new Promise((resolve) => {
        try{
            exec(`ping -c 5 ${ip}`, (err, stdout, stderr) => {
                if(err){
                    console.log(`adding ${Math.floor((Date.now() - timer) / 1000)} for `, ip)
                    akshit.labels(ip, name).inc(Math.floor((Date.now() - timer) / 1000))
                    resolve(false);
                }
                if(stderr){
                    console.log(`adding ${Math.floor((Date.now() - timer) / 1000)} for `, ip)
                    akshit.labels(ip, name).inc(Math.floor((Date.now() - timer) / 1000))
                    resolve(false);
                } 
                else if (stdout){                  
                    console.log("setting to 1 for ", ip)
                    akshit.labels(ip, name).set(0)
                    resolve(true);
                }
            });
        } catch(err){
            console.log('function had an error: ', error);
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

setInterval(async () => {
    Object.keys(IPs).forEach(key => {
        pingIP(IPs[key],key)
    })
}, 10000);
