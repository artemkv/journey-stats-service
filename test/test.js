"use strict";

const chai = require('chai');
const expect = chai.expect;

const statsFunctions = require('../statsfunc');

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