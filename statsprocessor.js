"use strict";

const handleAction = function handleAction(message) {
    console.log(`Received action ${message.id}:`);
    console.log(`\tData: ${message.data}`);
    console.log(`\tAttributes: ${message.attributes}`);
    message.ack();
};

const handleError = function handleError(message) {
    console.log(`Received error ${message.id}:`);
    console.log(`\tData: ${message.data}`);
    console.log(`\tAttributes: ${message.attributes}`);
    message.ack();
};

exports.handleAction = handleAction;
exports.handleError = handleError;