// Requirements
const mqtt = require('mqtt')

const logging = require('./homeautomation-js-lib/logging.js')
const mqtt_helpers = require('./homeautomation-js-lib/mqtt_helpers.js')
const energycurb = require('./homeautomation-js-lib/energycurb.js')

const curb = require('./curb.js')


// Config
const dst_host = process.env.MQTT_HOST
const topic_prefix = process.env.ENERGY_CURB_PREFIX
const username = process.env.ENERGY_CURB_USER
const password = process.env.ENERGY_CURB_PASS


// Setup MQTT
const dst_client = mqtt.connect(dst_host)

// MQTT Observation

dst_client.on('connect', () => {
    logging.log('Reconnecting...\n')
})

dst_client.on('disconnect', () => {
    logging.log('Reconnecting...\n')
    dst_client.connect(dst_host)
})

// energycurb.set_user_pass(username, password)
// energycurb.set_client_callback(function(topic, message) {
//     logging.log("topic: " + topic + "   message: " + message)
//     mqtt_helpers.publish(dst_client, topic, message)
// })

var userInfo = {}

userInfo.username = username
userInfo.password = password
userInfo.curb_client_id = 'R7LHLp5rRr6ktb9hhXfMaILsjwmIinKa'
userInfo.curb_client_secret = 'pcxoDsqCN7o_ny5KmEKJ2ci0gL5qqOSfxnzF6JIvwsfRsUVXFdD-DUc40kkhHAZR'


curb.connect(userInfo, st, saveCurbToken);