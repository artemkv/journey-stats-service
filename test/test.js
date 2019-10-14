"use strict";

const chai = require('chai');
const expect = chai.expect;

const statsFunctions = require('../statsfunc');
const statsProcessor = require('../statsprocessor');

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

it(':( Cannot submit action with no aid', function (done) {
    let action = JSON.parse('{"act":"act_complete_trial","par":"aaa","dts":"2019-10-08T20:21:04.047Z"}');
    statsProcessor.handleAction({ id: "mock", data: action, ack: function() {} })
        .then(result => {
            expect(result.error).to.equal("missing or empty attribute 'aid'");
            return done();
        });
});

it(':( Cannot submit action message is still acked', function (done) {
    let acked = false;
    let action = JSON.parse('{"act":"act_complete_trial","par":"aaa","dts":"2019-10-08T20:21:04.047Z"}');
    statsProcessor.handleAction({ id: "mock", data: action, ack: function() { acked = true; } })
        .then(_ => {
            expect(acked).to.equal(true);
            return done();
        });
});