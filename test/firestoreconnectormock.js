"use strict";

let lastAppExistsCallData = {
    isCalled: false
};
let lastUpdateUserStatsCallData = {
    isCalled: false
};
let lastUpdateUserStageStatsCallData = {
    isCalled: false
};

const testInit = function testInit() {
    lastAppExistsCallData.isCalled = false;
    lastUpdateUserStatsCallData.isCalled = false;
    lastUpdateUserStageStatsCallData.isCalled = false;
}

const appExists = async function appExists(aid) {
    lastAppExistsCallData.isCalled = true;
    lastAppExistsCallData.aid = aid;
    if (aid === "existing") {
        return true;
    }
    return false;
}

const updateUserStats = function updateUserStats(action, hourDt, dayDt, monthDt) {
    lastUpdateUserStatsCallData.isCalled = true;
    lastUpdateUserStatsCallData.action = action;
    lastUpdateUserStatsCallData.hourDt = hourDt;
    lastUpdateUserStatsCallData.dayDt = dayDt;
    lastUpdateUserStatsCallData.monthDt = monthDt;
}

const updateUserStageStats = function updateUserStageStats(action, newStage, hourDt, dayDt, monthDt) {
    lastUpdateUserStageStatsCallData.isCalled = true;
    lastUpdateUserStageStatsCallData.action = action;
    lastUpdateUserStageStatsCallData.newStage = newStage;
    lastUpdateUserStageStatsCallData.hourDt = hourDt;
    lastUpdateUserStageStatsCallData.dayDt = dayDt;
    lastUpdateUserStageStatsCallData.monthDt = monthDt;
}

const updateActionStats = async function updateActionStats(action, monthDt) {
    // TODO:
}

exports.testInit = testInit;
exports.lastAppExistsCallData = lastAppExistsCallData;
exports.lastUpdateUserStatsCallData = lastUpdateUserStatsCallData;
exports.lastUpdateUserStageStatsCallData = lastUpdateUserStageStatsCallData;

exports.updateUserStats = updateUserStats;
exports.updateUserStageStats = updateUserStageStats;
exports.appExists = appExists;
exports.updateActionStats = updateActionStats;