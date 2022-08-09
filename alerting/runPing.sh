#!/bin/sh


export NAMES=`cat "config/config.json" |awk '/"NAME":./{print $2}'|sed -e ':a' -e 'N' -e '$!ba' -e 's/\n/ /g' -e ' '|sed -e 's/ //g' -e 's/.$//' `
export IPS=`cat "config/config.json" |awk '/"IP":/{print $2}'|sed -e ':a' -e 'N' -e '$!ba' -e 's/\n/ /g' -e ' '|sed -e 's/ //g' -e 's/.$//' `

node ./alerting/ping.js --names $NAMES --ips $IPS