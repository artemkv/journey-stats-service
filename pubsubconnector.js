"use strict";

const dotenv = require('dotenv');
const { PubSub } = require('@google-cloud/pubsub');

dotenv.config();

const actionSubscriptionName = process.env.ACTION_SUBSCRIPTION // TODO: failfast if not set
const errorSubscriptionName = process.env.ERROR_SUBSCRIPTION
const pubsub = new PubSub();

function subscribe(subscriptionName, handler) {
    const subscription = pubsub.subscription(subscriptionName);
    subscription.on('message', handler);
}

const subscribeToAction = function subscribeToAction(handler) {
    subscribe(actionSubscriptionName, handler);
}

const subscribeToError = function subscribeToError(handler) {
    subscribe(errorSubscriptionName, handler);
}

exports.subscribeToAction = subscribeToAction;
exports.subscribeToError = subscribeToError;