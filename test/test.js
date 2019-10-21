"use strict";

const chai = require('chai');
const expect = chai.expect;

const statsFunctions = require('../statsfunc');
const statsProcessor = require('../statsprocessor');
const storeConnector = require('./firestoreconnectormock');

it('Validate action is not null', function (done) {
    let validationResult = statsFunctions.validateAction(null);
    expect(validationResult.error).to.equal('action is empty');
    return done();
});

it('Validate action contains app id', function (done) {
    let validationResult = statsFunctions.validateAction({});
    expect(validationResult.error).to.equal("missing or empty attribute 'aid'");
    return done();
});

it('Validate error is not null', function (done) {
    let validationResult = statsFunctions.validateError(null);
    expect(validationResult.error).to.equal('error is empty');
    return done();
});

it('Validate error contains app id', function (done) {
    let validationResult = statsFunctions.validateError({});
    expect(validationResult.error).to.equal("missing or empty attribute 'aid'");
    return done();
});

it(':) Submit action message', function (done) {
    storeConnector.testInit();

    let action = {
        "aid":"existing",
        "uid":"ceb2a540-48c7-40ec-bc22-24ffd54d880d",
        "act":"act_complete_trial",
        "par":"aaa",
        "dts":"2019-10-08T20:21:04.047Z"};
    statsProcessor.handleAction({ id: "mock", data: action, ack: function() {} })
        .then(_ => {
            expect(storeConnector.lastAppExistsCallData.isCalled).to.equal(true);
            expect(storeConnector.lastAppExistsCallData.aid).to.equal('existing');

            expect(storeConnector.lastUpdateUserStatsCallData.isCalled).to.equal(true);
            expect(storeConnector.lastUpdateUserStatsCallData.action.aid).to.equal('existing');
            expect(storeConnector.lastUpdateUserStatsCallData.hourDt).to.equal('2019100820');
            expect(storeConnector.lastUpdateUserStatsCallData.dayDt).to.equal('20191008');
            expect(storeConnector.lastUpdateUserStatsCallData.monthDt).to.equal('201910');

            expect(storeConnector.lastUpdateUserStageStatsCallData.isCalled).to.equal(true);
            expect(storeConnector.lastUpdateUserStageStatsCallData.newStage).to.equal("stage_engage");

            return done();
        });
});

it(':) Cannot submit action with inexisting aid', function (done) {
    storeConnector.testInit();

    let action = {
        "aid":"non-existing",
        "uid":"ceb2a540-48c7-40ec-bc22-24ffd54d880d",
        "act":"act_complete_trial",
        "par":"aaa",
        "dts":"2019-10-08T20:21:04.047Z"};
    statsProcessor.handleAction({ id: "mock", data: action, ack: function() {} })
        .then(_ => {
            expect(storeConnector.lastAppExistsCallData.isCalled).to.equal(true);
            expect(storeConnector.lastAppExistsCallData.aid).to.equal('non-existing');

            expect(storeConnector.lastUpdateUserStatsCallData.isCalled).to.equal(false);

            return done();
        });
});

it(':) Message is acked when success', function (done) {
    storeConnector.testInit();
    let acked = false;

    let action = {
        "aid":"existing",
        "uid":"ceb2a540-48c7-40ec-bc22-24ffd54d880d",
        "act":"act_complete_trial",
        "par":"aaa",
        "dts":"2019-10-08T20:21:04.047Z"};
    statsProcessor.handleAction({ id: "mock", data: action, ack: function() { acked = true; } })
        .then(_ => {
            expect(storeConnector.lastAppExistsCallData.isCalled).to.equal(true);
            expect(storeConnector.lastUpdateUserStatsCallData.isCalled).to.equal(true);

            expect(acked).to.equal(true);

            return done();
        });
});

it(':) Message is acked when failure', function (done) {
    storeConnector.testInit();
    let acked = false;

    let action = {
        "aid":"non-existing",
        "uid":"ceb2a540-48c7-40ec-bc22-24ffd54d880d",
        "act":"act_complete_trial",
        "par":"aaa",
        "dts":"2019-10-08T20:21:04.047Z"};
    statsProcessor.handleAction({ id: "mock", data: action, ack: function() { acked = true; } })
        .then(_ => {
            expect(storeConnector.lastAppExistsCallData.isCalled).to.equal(true);
            expect(storeConnector.lastUpdateUserStatsCallData.isCalled).to.equal(false);

            expect(acked).to.equal(true);

            return done();
        });
});

it(':) Submit error message', function (done) {
    storeConnector.testInit();

    let error = {
        "aid":"existing",
        "uid":"ceb2a540-48c7-40ec-bc22-24ffd54d880d",
        "msg":"divide by zero",
        "dtl":"line 1",
        "dts":"2019-10-08T20:21:04.047Z"};
    statsProcessor.handleError({ id: "mock", data: error, ack: function() {} })
        .then(_ => {
            expect(storeConnector.lastUpdateErrorStatsCallData.isCalled).to.equal(true);
            expect(storeConnector.lastUpdateErrorStatsCallData.msg).to.equal('divide by zero');

            return done();
        });
});
