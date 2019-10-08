"use strict";

const SERVICE_URL = `http://${process.env.NODE_IP || 'localhost'}:${process.env.NODE_PORT || 8700}`;

const chai = require('chai');
const expect = chai.expect;
const request = require('request');

describe('[REST Api Test Suite]', function () {
    it(':) Health check', function (done) {
        request.get(`${SERVICE_URL}/health`, function (error, response, body) {
            expect(response.statusCode).to.equal(200);
            done();
        });
    });

    it(':) Liveness probe', function (done) {
        request.get(`${SERVICE_URL}/liveness`, function (error, response, body) {
            expect(response.statusCode).to.equal(200);
            done();
        });
    });

    it(':) Readiness probe', function (done) {
        request.get(`${SERVICE_URL}/readiness`, function (error, response, body) {
            expect(response.statusCode).to.equal(200);
            done();
        });
    });

    it(':( Try accessing root', function (done) {
        request.get(SERVICE_URL, function (error, response, body) {
            expect(response.statusCode).to.equal(404);

            let expectedError = {
                error: "Not Found"
            };
            let actual = JSON.parse(body);
            expect(actual).to.deep.equal(expectedError);

            done();
        });
    });

    it(':( Try accessing non-existing page', function (done) {
        request.get(`${SERVICE_URL}/xxx`, function (error, response, body) {
            expect(response.statusCode).to.equal(404);

            let expectedError = {
                error: "Not Found"
            };
            let actual = JSON.parse(body);
            expect(actual).to.deep.equal(expectedError);

            done();
        });
    });

    it(':( Handle error', function (done) {
        request.get(`${SERVICE_URL}/error`, function (error, response, body) {
            expect(response.statusCode).to.equal(500);

            let expectedError = {
                error: "Test error"
            };
            let actual = JSON.parse(body);
            expect(actual).to.deep.equal(expectedError);

            done();
        });
    });

    it(':( Handle REST error', function (done) {
        request.get(`${SERVICE_URL}/resterror`, function (error, response, body) {
            expect(response.statusCode).to.equal(501);

            let expectedError = {
                error: "Not Implemented"
            };
            let actual = JSON.parse(body);
            expect(actual).to.deep.equal(expectedError);

            done();
        });
    });
});