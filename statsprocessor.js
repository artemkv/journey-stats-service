"use strict";

const logger = require('@artemkv/consolelogger');
const statsFunctions = require('./statsfunc');
const storeConnector = require('./connectorprovider').getStoreConnector();

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

    let hourDt = statsFunctions.getHourDt(action.dts);
    let dayDt = statsFunctions.getDayDt(action.dts);
    let monthDt = statsFunctions.getMonthDt(action.dts);

    // User stats
    await storeConnector.updateUserStats(action, hourDt, dayDt, monthDt);

    // User stage stats
    let newStage = statsFunctions.extractNewStage(action.act);
    if (newStage) {
        await storeConnector.updateUserStageStats(action, newStage, hourDt, dayDt, monthDt);
    }

    await storeConnector.updateActionStats(action, monthDt);

    // TODO: continue, other stats
};

const handleAction = function handleAction(message) {
    logger.log(`Received action ${message.id}:`);
    return processAction(message)
        .then(() => {
            logger.log(`Updated stats for action ${message.id}.`);
            return { ok: true };
         })
        .catch((err) => {
            logger.log(`Failed to update stats for action ${message.id}: ${err}`);
            return { error: err.message };
        })
        .finally(() => {
            message.ack();
        });
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