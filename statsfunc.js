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

const validateError = function validateError(error) {
    if (!error) {
        return { error: "error is empty" };
    }

    if (!error.aid) {
        return { error: "missing or empty attribute 'aid'" };
    }
    if (!error.uid) {
        return { error: "missing or empty attribute 'uid'" };
    }
    if (!error.msg) {
        return { error: "missing or empty attribute 'msg'" };
    }
    if (!error.dtl) {
        return { error: "missing or empty attribute 'dtl'" };
    }
    if (!error.dts) {
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

const getDayDtFromHourDt = function getDayDtFromHourDt(hourDt) {
    return hourDt.substr(0, 8);
}

const getMonthDtFromHourDt = function getMonthDtFromHourDt(hourDt) {
    return hourDt.substr(0, 6);
}

const extractNewStage = function extractNewStage (action) {
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

const isLaterStage = function isLaterStage (prevStage, nextStage) {
    function getStageIndex(stage) {
        if (stage === 'stage_ftv') return 0;
        if (stage === 'stage_engage') return 1;
        if (stage === 'stage_signup') return 2;
        if (stage === 'stage_committed') return 3;
        if (stage === 'stage_paid') return 4;
    }

    let prevStageIndex = getStageIndex(prevStage);
    let nextStageIndex = getStageIndex(nextStage);

    return nextStageIndex > prevStageIndex;
}

exports.validateAction = validateAction;
exports.getHourDt = getHourDt;
exports.getDayDt = getDayDt;
exports.getMonthDt = getMonthDt;
exports.extractNewStage = extractNewStage;
exports.getDayDtFromHourDt = getDayDtFromHourDt;
exports.getMonthDtFromHourDt = getMonthDtFromHourDt;
exports.validateError = validateError;
exports.isLaterStage = isLaterStage;