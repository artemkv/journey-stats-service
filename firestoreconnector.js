"use strict";

const dotenv = require('dotenv');
const { Firestore } = require('@google-cloud/firestore');

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
    let dayKey = `${action.aid}.${stage}.${dayDt}`
    let monthKey = `${action.aid}.${stage}.${monthDt}`

    await db.runTransaction(async function(ts) {
        let userStage = db.collection("user.stage").doc(userKey);
        let userStageValue = await ts.get(userStage);

        let currentStage = null;
        if (userStageValue.exists) {
            currentStage = userStageValue.stage;
        }

        if (!currentStage || currentStage !== stage) {
            let stageHitsByDay = db.collection("stage.hits.byday").doc(dayKey);
            let stageHitsByMonth = db.collection("stage.hits.bymonth").doc(monthKey);
            let stageStaysByDay = db.collection("stage.stays.byday").doc(dayKey);
            let stageStaysByMonth = db.collection("stage.stays.bymonth").doc(monthKey);

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
        }
    });
}

exports.updateUserStats = updateUserStats;
exports.updateUserStageStats = updateUserStageStats;
exports.appExists = appExists;