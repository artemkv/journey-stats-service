const dotenv = require('dotenv');

dotenv.config();

const pubSubConnector = process.env.NODE_ENV === 'test' ? 
    require('./test/pubsubconnectormock') : require('./pubsubconnector');

const getPubSubConnector = function getPubSubConnector() {
    return pubSubConnector;
}

const storeConnector = process.env.NODE_ENV === 'test' ? 
    require('./test/firestoreconnectormock') : require('./firestoreconnector');

const getStoreConnector = function getStoreConnector() {
    return storeConnector;
}

exports.getPubSubConnector = getPubSubConnector;
exports.getStoreConnector = getStoreConnector;
