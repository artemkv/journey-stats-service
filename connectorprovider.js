const dotenv = require('dotenv');

dotenv.config();

const storeConnector = process.env.NODE_ENV === 'test' ? 
    require('./test/firestoreconnectormock') : require('./firestoreconnector');

const getStoreConnector = function getStoreConnector() {
    return storeConnector;
}

exports.getStoreConnector = getStoreConnector;