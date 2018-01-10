// Requirements
const mqtt = require('mqtt')
const _ = require('lodash')

const logging = require('homeautomation-js-lib/logging.js')
const health = require('homeautomation-js-lib/health.js')
const curb = require('./curb.js')

require('homeautomation-js-lib/mqtt_helpers.js')

// Config
const dst_host = process.env.MQTT_HOST
const topic_prefix = process.env.ENERGY_CURB_PREFIX
const username = process.env.ENERGY_CURB_USER
const password = process.env.ENERGY_CURB_PASS


// Setup MQTT
const dst_client = mqtt.connect(dst_host)

// MQTT Observation

dst_client.on('connect', () => {
    logging.info('Reconnecting...\n')
})

dst_client.on('disconnect', () => {
    logging.info('Reconnecting...\n')
    dst_client.connect(dst_host)
})

// energycurb.set_user_pass(username, password)
// energycurb.set_client_callback(function(topic, message) {
//     logging.info("topic: " + topic + "   message: " + message)
//     mqtt_helpers.publish(dst_client, topic, message)
// })

var userInfo = {}

userInfo.username = username
userInfo.password = password

if (_.isNil(topic_prefix)) {
    logging.warn('ENERGY_CURB_PREFIX not set, not starting')
    process.abort()
}

var connectedEvent = function() {
    health.healthyEvent()
}

var disconnectedEvent = function() {
    health.unhealthyEvent()
}

// Setup MQTT
var client = mqtt.setupClient(connectedEvent, disconnectedEvent)

var refreshedToken = function(token) {
    console.log('token updated: ' + token)
}

var liveData = function(id, label, wattage, isProduction, isMain, isOther) {
    health.healthyEvent()
    var topic = topic_prefix + '/' + _.snakeCase(label)
    client.smartPublish(topic, '' + wattage)
        // console.log('topic: ' + topic + '   watts: ' + wattage + ' isOther: ' + isOther)
}

curb.connect(userInfo, refreshedToken, liveData)
