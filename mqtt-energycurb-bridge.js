// Requirements
mqtt = require('mqtt')

logging = require('./homeautomation-js-lib/logging.js')
mqtt_helpers = require('./homeautomation-js-lib/mqtt_helpers.js')
energycurb = require('./homeautomation-js-lib/energycurb.js')


// Config
dst_host = process.env.MQTT_HOST
topic_prefix = process.env.ENERGY_CURB_PREFIX
username = process.env.ENERGY_CURB_USER
password = process.env.ENERGY_CURB_PASS

// Set up modules
logging.set_enabled(false)


// Setup MQTT
dst_client = mqtt.connect(dst_host)

// MQTT Observation

dst_client.on('connect', () => {
    logging.log('Reconnecting...\n')
})

dst_client.on('disconnect', () => {
    logging.log('Reconnecting...\n')
    dst_client.connect(dst_host)
})

energycurb.set_user_pass(username, password)
energycurb.set_client_callback(function(topic, message) {
    logging.log("topic: " + topic + "   message: " + message)
    mqtt_helpers.publish(dst_client, topic, message)
})