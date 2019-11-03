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
    let hourKey = `${action.aid}.${action.uid}.${hourDt}`
    let dayKey = `${action.aid}.${action.uid}.${dayDt}`
    let monthKey = `${action.aid}.${action.uid}.${monthDt}`

    // Records to track visits per user per date
    let uniqueVisitsByHour = db.collection("user.visits.byhour").doc(hourKey);
    let uniqueVisitsByDay = db.collection("user.visits.byday").doc(dayKey);
    let uniqueVisitsByMonth = db.collection("user.visits.bymonth").doc(monthKey);

    // Records to track unique users per date
    let uniqueUsersByHour = db.collection("uniqueusers.byhour").doc(hourKey);
    let uniqueUsersByDay = db.collection("uniqueusers.byday").doc(dayKey);
    let uniqueUsersByMonth = db.collection("uniqueusers.bymonth").doc(monthKey);

    // Make sure the record exists so we could update it safely
    await uniqueVisitsByHour.set({}, { merge: true });
    await uniqueVisitsByDay.set({}, { merge: true });
    await uniqueVisitsByMonth.set({}, { merge: true });
    await uniqueUsersByHour.set({}, { merge: true });
    await uniqueUsersByDay.set({}, { merge: true });
    await uniqueUsersByMonth.set({}, { merge: true });

    // Get current values - at least one of the instances should see value of 0
    // In theory it can be that 2 instances both see the value of 0 and increment
    // This could be avoided in several ways, but I am going to ignore it for now
    let uniqueVisitsByHourValue = await uniqueVisitsByHour.get();
    let uniqueVisitsByDayValue = await uniqueVisitsByDay.get();
    let uniqueVisitsByMonthValue = await uniqueVisitsByMonth.get();

    // Increment visits
    await uniqueVisitsByHour.update({ count: increment });
    await uniqueVisitsByDay.update({ count: increment });
    await uniqueVisitsByMonth.update({ count: increment });

    // If for any of the dates we saw 0 before the update, update unique users count
    if (uniqueVisitsByHourValue.exists && !uniqueVisitsByHourValue.data().count) {
        uniqueUsersByHour.update({ count: increment });
    }
    if (uniqueVisitsByDayValue.exists && !uniqueVisitsByDayValue.data().count) {
        uniqueUsersByDay.update({ count: increment });
    }
    if (uniqueVisitsByMonthValue.exists && !uniqueVisitsByMonthValue.data().count) {
        uniqueUsersByMonth.update({ count: increment });
    }
}

const updateUserStageStats = async function updateUserStageStats(action, stage, hourDt, dayDt, monthDt) {
    let userKey = `${action.aid}.${action.uid}`

    let newStageDayKey = `${action.aid}.${stage}.${dayDt}`
    let newStageMonthKey = `${action.aid}.${stage}.${monthDt}`

    await db.runTransaction(async function(ts) {
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

        let actionByStageKey = `${action.aid}.${monthDt}.${stage}.${action.act}`

        let param = action.par;
        if (!param) {
            param = "none";
        }
        let actionByParamKey = `${action.aid}.${monthDt}.${action.act}.${param}`

        let actionsByMonthByStage = db.collection("actions.bymonth.bystage").doc(actionByStageKey);
        let actionsByMonthByParam = db.collection("actions.bymonth.byparam").doc(actionByParamKey);

        // Make sure the record exists so we could update it safely
        await actionsByMonthByStage.set({}, { merge: true });
        await actionsByMonthByParam.set({}, { merge: true });

        await actionsByMonthByStage.update({ count: increment });
        await actionsByMonthByParam.update({ count: increment });
    } else {
        throw new Error(`No current stage is registered for user ${action.uid}`);
    }
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

    // Error count

    let errorDayKey = `${error.aid}.${dayDt}.${hash}`
    let errorMonthKey = `${error.aid}.${monthDt}.${hash}`

    let errorsByDay = db.collection("errors.byday").doc(errorDayKey);
    let errorsByMonth = db.collection("errors.bymonth").doc(errorMonthKey);

    // Make sure the record exists so we could update it safely
    await errorsByDay.set({}, { merge: true });
    await errorsByMonth.set({}, { merge: true });

    await errorsByDay.update({ count: increment });
    await errorsByMonth.update({ count: increment });

    // Total error count

    let dayKey = `${error.aid}.${dayDt}`
    let monthKey = `${error.aid}.${monthDt}`

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
        let errorByStageKey = `${error.aid}.${monthDt}.${stage}.${hash}`
        let errorsByMonthByStage = db.collection("errors.bymonth.bystage").doc(errorByStageKey);

        // Make sure the record exists so we could update it safely
        await errorsByMonthByStage.set({}, { merge: true });

        await errorsByMonthByStage.update({ count: increment });
    }
}

exports.updateUserStats = updateUserStats;
exports.updateUserStageStats = updateUserStageStats;
exports.appExists = appExists;
exports.updateActionStats = updateActionStats;
exports.updateErrorStats = updateErrorStats;
