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
    
    logger.initialize(`${__dirname}/log`);
    logger.log('Application started: http://' + ip + ":" + port + '/');
    restStats.initialize(version);

    // everything has been initialized
    health.setIsReady();
});