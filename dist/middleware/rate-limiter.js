"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ipLimiterForConfirmation = exports.ipLimiterForLogin = exports.ipLimiterForEmailResending = exports.ipLimiterForRegistr = void 0;
const request1 = {};
const ipLimiterForRegistr = (limit, timeInSeconds) => {
    return (req, res, next) => {
        const key = process.env.NODE_ENV === 'test'
            ? `test-ip:${req.path}`
            : `${req.ip}:${req.path}`;
        const now = Date.now();
        const tenSecondsInMs = timeInSeconds * 1000;
        if (!request1[key] || now - request1[key].firstRequestTime > tenSecondsInMs) {
            request1[key] = {
                count: 0,
                firstRequestTime: now,
            };
        }
        if (request1[key].count >= limit) {
            return res.sendStatus(429);
        }
        request1[key].count++;
        next();
    };
};
exports.ipLimiterForRegistr = ipLimiterForRegistr;
const request2 = {};
const ipLimiterForEmailResending = (limit, timeInSeconds) => {
    return (req, res, next) => {
        const key = process.env.NODE_ENV === 'test'
            ? `test-ip:${req.path}`
            : `${req.ip}:${req.path}`;
        const now = Date.now();
        const tenSecondsInMs = timeInSeconds * 1000;
        if (!request2[key] || now - request2[key].firstRequestTime > tenSecondsInMs) {
            request2[key] = {
                count: 1,
                firstRequestTime: now,
            };
        }
        else {
            request2[key].count++;
        }
        if (request2[key].count > limit) {
            return res.sendStatus(429);
        }
        next();
    };
};
exports.ipLimiterForEmailResending = ipLimiterForEmailResending;
const request3 = {};
const ipLimiterForLogin = (limit, timeInSeconds) => {
    return (req, res, next) => {
        const key = process.env.NODE_ENV === 'test'
            ? `test-ip:${req.path}`
            : `${req.ip}:${req.path}`;
        const now = Date.now();
        const tenSecondsInMs = timeInSeconds * 1000;
        if (!request3[key] || now - request3[key].firstRequestTime > tenSecondsInMs) {
            request3[key] = {
                count: 0,
                firstRequestTime: now,
            };
        }
        if (request3[key].count >= limit) {
            return res.sendStatus(429);
        }
        request3[key].count++;
        next();
    };
};
exports.ipLimiterForLogin = ipLimiterForLogin;
const request4 = {};
const ipLimiterForConfirmation = (limit, timeInSeconds) => {
    return (req, res, next) => {
        const key = process.env.NODE_ENV === 'test'
            ? `test-ip:${req.path}`
            : `${req.ip}:${req.path}`;
        const now = Date.now();
        const tenSecondsInMs = timeInSeconds * 1000;
        if (!request4[key] || now - request4[key].firstRequestTime > tenSecondsInMs) {
            request4[key] = {
                count: 0,
                firstRequestTime: now,
            };
        }
        if (request4[key].count >= limit) {
            return res.sendStatus(429);
        }
        request4[key].count++;
        next();
    };
};
exports.ipLimiterForConfirmation = ipLimiterForConfirmation;
