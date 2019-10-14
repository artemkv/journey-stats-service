"use strict";

const dt = require('@artemkv/datetimeutil');

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

exports.validateAction = validateAction;
exports.getHourDt = getHourDt;
exports.getDayDt = getDayDt;
exports.getMonthDt = getMonthDt;