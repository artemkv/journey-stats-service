const dotenv = require('dotenv');

dotenv.config();

const pubSubConnector = process.env.NODE_ENV === 'test' ? 
    require('./test/pubsubconnectormock') : require('./pubsubconnector');

const getPubSubConnector = function getPubSubConnector() {
    return pubSubConnector;
}

exports.getPubSubConnector = getPubSubConnector;