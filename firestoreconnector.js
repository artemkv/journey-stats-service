"use strict";

const dotenv = require('dotenv');
const statsFunctions = require('./statsfunc');
const { Firestore } = require('@google-cloud/firestore');
const sjcl = require('sjcl');

dotenv.config();

const db = new Firestore();
const increment = Firestore.FieldValue.increment(1);

const appExists = async function appExists(aid) {
    let app = await db.collection("apps").doc(aid).get();
    if (app.exists) {
        return true;
    }
    return false;
}

const updateUserStats = async function updateUserStats(action, hourDt, dayDt, monthDt) {
    let userHourKey = `${action.aid}.${action.uid}.${hourDt}`
    let userDayKey = `${action.aid}.${action.uid}.${dayDt}`
    let userMonthKey = `${action.aid}.${action.uid}.${monthDt}`

    await db.runTransaction(async function (ts) {
        // Records to track visits per user per date
        let userVisitsByHour = db.collection("user.visits.byhour").doc(userHourKey);
        let userVisitsByDay = db.collection("user.visits.byday").doc(userDayKey);
        let userVisitsByMonth = db.collection("user.visits.bymonth").doc(userMonthKey);

        let hourKey = `${action.aid}.${hourDt}`
        let dayKey = `${action.aid}.${dayDt}`
        let monthKey = `${action.aid}.${monthDt}`

        // Records to track unique users per date
        let uniqueUsersByHour = db.collection("uniqueusers.byhour").doc(hourKey);
        let uniqueUsersByDay = db.collection("uniqueusers.byday").doc(dayKey);
        let uniqueUsersByMonth = db.collection("uniqueusers.bymonth").doc(monthKey);

        // Current counts
        let userVisitsByHourValue = await ts.get(userVisitsByHour);
        let userVisitsByDayValue = await ts.get(userVisitsByDay);
        let userVisitsByMonthValue = await ts.get(userVisitsByMonth);

        // Make sure the record exists so we could update it safely
        ts.set(userVisitsByHour, {}, { merge: true });
        ts.set(userVisitsByDay, {}, { merge: true });
        ts.set(userVisitsByMonth, {}, { merge: true });
        
        // Increment visits
        ts.update(userVisitsByHour, { count: increment });
        ts.update(userVisitsByDay, { count: increment });
        ts.update(userVisitsByMonth, { count: increment });

        // If the first visit, update unique users count
        if (!userVisitsByHourValue.exists) {
            ts.set(uniqueUsersByHour, {}, { merge: true });
            ts.update(uniqueUsersByHour, { count: increment });
        }
        if (!userVisitsByDayValue.exists) {
            ts.set(uniqueUsersByDay, {}, { merge: true });
            ts.update(uniqueUsersByDay, { count: increment });
        }
        if (!userVisitsByMonthValue.exists) {
            ts.set(uniqueUsersByMonth, {}, { merge: true });
            ts.update(uniqueUsersByMonth, { count: increment });
        }
    });
}

const updateUserStageStats = async function updateUserStageStats(action, stage, hourDt, dayDt, monthDt) {
    let userKey = `${action.aid}.${action.uid}`

    let newStageDayKey = `${action.aid}.${stage}.${dayDt}`
    let newStageMonthKey = `${action.aid}.${stage}.${monthDt}`

    await db.runTransaction(async function (ts) {
        let userStage = db.collection("user.stage").doc(userKey);
        let userStageValue = await ts.get(userStage);

        let prevStage = null;
        if (userStageValue.exists) {
            prevStage = userStageValue.data().stage;
        }

        // only if stage is higher than current stage
        if (!prevStage || statsFunctions.isLaterStage(prevStage, stage)) {
            let stageHitsByDay = db.collection("stage.hits.byday").doc(newStageDayKey);
            let stageHitsByMonth = db.collection("stage.hits.bymonth").doc(newStageMonthKey);
            let stageStaysByDay = db.collection("stage.stays.byday").doc(newStageDayKey);
            let stageStaysByMonth = db.collection("stage.stays.bymonth").doc(newStageMonthKey);

            // Make sure the record exists so we could update it safely
            ts.set(userStage, {}, { merge: true });
            ts.set(stageHitsByDay, {}, { merge: true });
            ts.set(stageHitsByMonth, {}, { merge: true });
            ts.set(stageStaysByDay, {}, { merge: true });
            ts.set(stageStaysByMonth, {}, { merge: true });

            ts.update(userStage, { stage: stage, dt: hourDt });

            ts.update(stageHitsByDay, { count: increment });
            ts.update(stageHitsByMonth, { count: increment });

            ts.update(stageStaysByDay, { count: increment });
            ts.update(stageStaysByMonth, { count: increment });

            if (prevStage) {
                if (statsFunctions.getDayDtFromHourDt(userStageValue.data().dt) !== dayDt) {
                    let prevStageDayKey = `${action.aid}.${prevStage}.${dayDt}`
                    let prevStageStaysByDay = db.collection("stage.stays.byday").doc(prevStageDayKey);
                    // Make sure the record exists so we could update it safely
                    ts.set(prevStageStaysByDay, {}, { merge: true });
                    ts.update(prevStageStaysByDay, { count: increment });
                }
                if (statsFunctions.getMonthDtFromHourDt(userStageValue.data().dt) !== monthDt) {
                    let prevStageMonthKey = `${action.aid}.${prevStage}.${monthDt}`
                    let prevStageStaysByMonth = db.collection("stage.stays.bymonth").doc(prevStageMonthKey);
                    // Make sure the record exists so we could update it safely
                    ts.set(prevStageStaysByMonth, {}, { merge: true });
                    ts.update(prevStageStaysByMonth, { count: increment });
                }
            }
        }
    });
}

const updateActionStats = async function updateActionStats(action, monthDt) {
    let userKey = `${action.aid}.${action.uid}`
    let userStage = await db.collection("user.stage").doc(userKey).get();
    if (userStage.exists) {
        var stage = userStage.data().stage;
    } else {
        var stage = 'none';
    }
    let actionByStageKey = `${action.aid}.${monthDt}.${stage}`
    let actionsByMonthByStage = db.collection("actions.bymonth.bystage").doc(actionByStageKey);

    // Actions by param
    let param = action.par;
    if (!param) {
        param = "none";
    }
    let actionByParamKey = `${action.aid}.${monthDt}`
    let actionsByMonthByParam = db.collection("actions.bymonth.byparam").doc(actionByParamKey);
    await actionsByMonthByStage.set({ [action.act]: { count: increment } }, { merge: true });
    await actionsByMonthByParam.set({ [action.act]: { [param]: { count: increment } } }, { merge: true });
}

const updateErrorStats = async function updateErrorStats(error, hourDt, dayDt, monthDt) {
    let hashArr = sjcl.hash.sha256.hash(`${error.msg}(${error.dtl})`);
    let hash = hashArr.reduce((prev, curr) => prev + curr + "").replace(/-/g, 'M');

    // Save error
    let errKey = `${error.aid}.${hash}`
    let errorRecord = db.collection("error").doc(errKey);
    await errorRecord.set({
        message: error.msg,
        details: error.dtl
    });

    let dayKey = `${error.aid}.${dayDt}`
    let monthKey = `${error.aid}.${monthDt}`

    // Error count

    let errorsByDay = db.collection("errors.byday").doc(dayKey);
    let errorsByMonth = db.collection("errors.bymonth").doc(monthKey);
    await errorsByDay.set({ [hash]: { count: increment } }, { merge: true });
    await errorsByMonth.set({ [hash]: { count: increment } }), { merge: true };

    // Total error count

    let totalErrorsByDay = db.collection("totalerrors.byday").doc(dayKey);
    let totalErrorsByMonth = db.collection("totalerrors.bymonth").doc(monthKey);

    // Make sure the record exists so we could update it safely
    await totalErrorsByDay.set({}, { merge: true });
    await totalErrorsByMonth.set({}, { merge: true });

    await totalErrorsByDay.update({ count: increment });
    await totalErrorsByMonth.update({ count: increment });

    // Errors by stage

    let userKey = `${error.aid}.${error.uid}`
    let userStage = await db.collection("user.stage").doc(userKey).get();
    if (userStage.exists) {
        var stage = userStage.data().stage;
        let errorByStageKey = `${error.aid}.${monthDt}.${stage}`
        let errorsByMonthByStage = db.collection("errors.bymonth.bystage").doc(errorByStageKey);
        await errorsByMonthByStage.set({ [hash]: { count: increment } }, { merge: true });
    }
}

exports.updateUserStats = updateUserStats;
exports.updateUserStageStats = updateUserStageStats;
exports.appExists = appExists;
exports.updateActionStats = updateActionStats;
exports.updateErrorStats = updateErrorStats;
