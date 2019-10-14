"use strict";

const dt = require('@artemkv/datetimeutil');

// Pure function go here

const validateAction = function validateAction(action) {
    if (!action) {
        return { error: "action is empty" };
    }

    if (!action.aid) {
        return { error: "missing or empty attribute 'aid'" };
    }
    if (!action.uid) {
        return { error: "missing or empty attribute 'uid'" };
    }
    if (!action.act) {
        return { error: "missing or empty attribute 'act'" };
    }
    if (!action.dts) {
        return { error: "missing or empty attribute 'dts'" };
    }
    return { ok: true }
}

const getHourDt = function getHourDt(date) {
    let dateUtc = new Date(date);
    return dt.getYearString(dateUtc) + dt.getMonthString(dateUtc) +
        dt.getDayString(dateUtc) + dt.getHoursString(dateUtc);
}

const getDayDt = function getDayDt(date) {
    let dateUtc = new Date(date);
    return dt.getYearString(dateUtc) + dt.getMonthString(dateUtc) +
        dt.getDayString(dateUtc);
}

const getMonthDt = function getMonthDt(date) {
    let dateUtc = new Date(date);
    return dt.getYearString(dateUtc) + dt.getMonthString(dateUtc);
}

const extractNewStage = function (action) {
    if (action === "act_land_on_site") {
        return "stage_ftv";
    }
    if (action === "act_complete_trial") {
        return "stage_engage";
    }
    if (action === "act_begin_signup") {
        return "stage_signup";
    }
    if (action === "act_complete_signup") {
        return "stage_committed";
    }
    if (action === "act_payment") {
        return "stage_paid";
    }
    return null;
}

exports.validateAction = validateAction;
exports.getHourDt = getHourDt;
exports.getDayDt = getDayDt;
exports.getMonthDt = getMonthDt;
exports.extractNewStage = extractNewStage;