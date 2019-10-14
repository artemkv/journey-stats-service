"use strict";

const logger = require('@artemkv/consolelogger');
const statsFunctions = require('./statsfunc');
const storeConnector = require('./firestoreconnector'); // TODO: get from connection provider

async function processAction(message) {
    let action = message.data;

    // Structural validation
    let validationResult = statsFunctions.validateAction(action);
    if (validationResult.error) {
        throw new Error(validationResult.error);
    }

    // Check with database
    if (! await storeConnector.appExists(action.aid)) {
        throw new Error(`Application '${action.aid}' does not exist`);
    }

    await storeConnector.updateUserStats(
        action,
        statsFunctions.getHourDt(action.dts),
        statsFunctions.getDayDt(action.dts),
        statsFunctions.getMonthDt(action.dts))

    // TODO: continue, other stats
};

const handleAction = function handleAction(message) {
    logger.log(`Received action ${message.id}:`);
    processAction(message)
        .then(() => logger.log(`Updated stats for action ${message.id}.`))
        .catch((err) => logger.log(`Failed to update stats for action ${message.id}: ${err}`))
        .finally(() => message.ack());
}

// TODO: implement
const handleError = function handleError(message) {
    logger.log(`Received error ${message.id}:`);
    logger.log(`\tData: ${message.data}`);
    logger.log(`\tAttributes: ${message.attributes}`);
    message.ack();
};

exports.handleAction = handleAction;
exports.handleError = handleError;