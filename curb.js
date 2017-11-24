const _ = require('lodash')
const logging = require('homeautomation-js-lib/logging.js')

var curbAccessToken = null
var curbRefreshToken = null

var clientId = null
var clientSecret = null

var locations = null
var liveDataCallback = null

var request = require('request')
var io = require('socket.io-client')

function getCurbToken(userInfo, refreshTokenCb, liveDataCb) {
    logging.log('Logging in to Curb')
    clientId = userInfo.curb_client_id
    clientSecret = userInfo.curb_client_secret
    liveDataCallback = liveDataCb

    userInfo.curb_client_id = 'R7LHLp5rRr6ktb9hhXfMaILsjwmIinKa'
    userInfo.curb_client_secret = 'pcxoDsqCN7o_ny5KmEKJ2ci0gL5qqOSfxnzF6JIvwsfRsUVXFdD-DUc40kkhHAZR'

    request.post({
            url: 'https://energycurb.auth0.com/oauth/token',
            form: {
                grant_type: 'password',
                audience: 'app.energycurb.com/api',
                scope: 'offline_access',
                username: userInfo.username,
                password: userInfo.password,
                client_id: userInfo.curb_client_id,
                client_secret: userInfo.curb_client_secret
            }
        },
        function(err, res, body) {
            if (res && res.statusCode == 200) {
                //logging.log("Response: " + body);

                curbAccessToken = JSON.parse(body).access_token
                curbRefreshToken = JSON.parse(body).refresh_token

                //logging.log("Curb Access Token: " + curbAccessToken);
                //logging.log("Curb Refresh Token: " + curbRefreshToken);

                refreshTokenCb(curbRefreshToken)

                setInterval(function() { refreshToken(function() {}) }, 20 * 60 * 60 * 1000)

                getCurbLocations()
            } else {
                logging.log('Something Went Wrong while submitting form data to Curb ' + res.statusCode + ': ' + body)
                if (err) throw err
            }
        })

}


function refreshToken(refreshCompleteCb) {
    logging.log('Refreshing Curb auth')

    request.post({
            url: 'https://energycurb.auth0.com/oauth/token',
            form: {
                grant_type: 'refresh_token',
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: curbRefreshToken
            }
        },
        function(err, res, body) {
            if (res && res.statusCode == 200) {
                //logging.log("Response: " + body);
                curbAccessToken = JSON.parse(body).access_token

                //logging.log("Curb Access Token: " + curbAccessToken);
                refreshCompleteCb()
            } else {
                logging.log('Something Went Wrong while getting refresh token ' + res.statusCode + ': ' + body)
                if (err) throw err
            }
        })
}

function useCurbToken(token, id, secret) {
    curbRefreshToken = token
    clientId = id
    clientSecret = secret

    refreshToken(getCurbLocations)
    setInterval(function() { refreshToken(function() {}) }, 20 * 60 * 60 * 1000)
}

function getCurbLocations() {
    logging.log('Requesting Curb location info')

    request
        .get('https://app.energycurb.com/api/locations',
            function(error, response, body) {
                if (response && response.statusCode == 200) {
                    logging.log('Curb Location Info: ' + body)
                    locations = JSON.parse(body)

                    connectToLiveData()
                } else {
                    logging.log('Something went wrong getting location info')
                    logging.log(response.statusCode)
                    logging.log(error)
                }
            })
        .auth(null, null, true, curbAccessToken)
}


function connectToLiveData() {
    var socket = io('https://app.energycurb.com/api/circuit-data', {
        reconnect: true,
        transports: ['websocket']
    })

    socket.on('connect', function() {
        logging.log('Connected to socket.io, authenticating')
        socket.emit('authenticate', { token: curbAccessToken }, function(data) { logging.log('Auth Ack: ' + data) })
    })
    socket.on('authorized',
        function() {
            logging.log('Authorized for socket.io, suscribing to live data')
            socket.emit('subscribe', locations[0].id)
        })
    socket.on('data',
            function(data) {
                // json = JSON.stringify(data)
                // logging.log('Got Live Data: ' + json)

                if (!_.isNil(liveDataCallback)) {
                    const circuits = data.circuits
                    circuits.forEach(function(circuit) {
                        liveDataCallback(circuit.id, circuit.label, circuit.w, circuit.production, circuit.main, circuit.other)
                    }, this)
                }
                //smartThings.send('data', json)
            })
        //socket.on('disconnect', connectToLiveData);
}


module.exports.connect = getCurbToken
module.exports.reconnect = useCurbToken