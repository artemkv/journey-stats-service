"use strict";

let lastAppExistsCallData = {
    isCalled: false
};
let lastUpdateUserStatsCallData = {
    isCalled: false
};

const testInit = function testInit() {
    lastAppExistsCallData.isCalled = false;
    lastUpdateUserStatsCallData.isCalled = false;
}

const appExists = async function appExists(aid) {
    lastAppExistsCallData.isCalled = true;
    lastAppExistsCallData.aid = aid;
    if (aid === "existing") {
        return true;
    }
    return false;
}

const updateUserStats = async function updateUserStats(action, hourDt, dayDt, monthDt) {
    lastUpdateUserStatsCallData.isCalled = true;
    lastUpdateUserStatsCallData.action = action;
    lastUpdateUserStatsCallData.hourDt = hourDt;
    lastUpdateUserStatsCallData.dayDt = dayDt;
    lastUpdateUserStatsCallData.monthDt = monthDt;
}

exports.testInit = testInit;
exports.lastAppExistsCallData = lastAppExistsCallData;
exports.lastUpdateUserStatsCallData = lastUpdateUserStatsCallData;

exports.updateUserStats = updateUserStats;
exports.appExists = appExists;