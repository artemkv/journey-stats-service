"use strict";

const dotenv = require('dotenv');
const connect = require('connect');
const favicon = require('serve-favicon');
const restStats = require('@artemkv/reststats');
const errorHandler = require('@artemkv/errorhandler');
const myRequest = require('@artemkv/myrequest');
const version = require('./myversion');
const logger = require('@artemkv/consolelogger');
const health = require('@artemkv/health');
const pubSubConnector = require('./connectorprovider').getPubSubConnector();
const statsProcessor = require('./statsprocessor');

dotenv.config();

let server = connect();

server
    // favicon
    .use(favicon('./favicon.ico'))

    // Assemble my request
    .use(myRequest)

    // Update stats
    .use(restStats.countRequest)

    // Used for testing / health checks
    .use('/health', health.handleHealthCheck)
    .use('/liveness', health.handleLivenessCheck)
    .use('/readiness', health.handleReadinessCheck)
    .use('/error', errorHandler.handleError)
    .use('/resterror', errorHandler.handleRestError)

    // Log session
    .use(function (req, res, next) {
        logger.logSession(req.my.path);
        return next();
    })

    // Statistics endpoint
    .use('/stats', restStats.getStats)

    // Do business
    // No business

    // Handles errors
    .use(function (err, req, res, next) {
        console.log(err);
        logger.logFailedRequest(req, res, err);
        next(err);
    })
    .use(errorHandler.handle404)
    .use(errorHandler.catchAll);

// Start the server
let env = process.env;
let port = env.NODE_PORT || 8700;
let ip = env.NODE_IP || 'localhost';
server.listen(port, ip, function () {
    console.log('Application started');
    console.log('http://' + ip + ":" + port + '/');
    
    logger.initialize();
    logger.log('Application started: http://' + ip + ":" + port + '/');
    restStats.initialize(version);

    pubSubConnector.subscribeToAction(statsProcessor.handleAction);
    pubSubConnector.subscribeToError(statsProcessor.handleError);

    // TODO: debug code
    /*let action = JSON.parse('{"aid":"test_KvQhf0pLxzd4z7nE9r1Z","uid":"ceb2a540-48c7-40ec-bc22-24ffd54d880d","act":"act_complete_trial","par":"","dts":"2019-11-08T20:21:04.047Z"}');
    statsProcessor.handleAction({ id: "mock", data: action, ack: function() { console.log("acked"); } })
        .then(x => {
            console.log("*** result is " + JSON.stringify(x));
        });*/
    /*let error = JSON.parse('{"aid" : "test_KvQhf0pLxzd4z7nE9r1Z","uid" : "ceb2a540-48c7-40ec-bc22-24ffd54d880d","msg" : "divide by zero 1","dtl" : "amF2YS5sYW5nLklsbGVnYWxTdGF0ZU...","dts":"2019-11-08T20:21:04.047Z"}');
    statsProcessor.handleError({ id: "mock", data: error, ack: function() { console.log("acked"); } })
        .then(x => {
            console.log("*** result is " + JSON.stringify(x));
        });*/

    // everything has been initialized
    health.setIsReady();
});