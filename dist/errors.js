"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenExpiredError = exports.InvalidRefreshTokenError = exports.DeviceNotOwnedError = exports.DeviceNotfoundError = void 0;
class DeviceNotfoundError extends Error {
    constructor(message = 'Device session not found') {
        super(message);
        this.name = 'DeviceNotFoundError';
    }
}
exports.DeviceNotfoundError = DeviceNotfoundError;
class DeviceNotOwnedError extends Error {
    constructor(message = 'Device session belongs to another user') {
        super(message);
        this.name = 'DeviceNotOwnedError';
    }
}
exports.DeviceNotOwnedError = DeviceNotOwnedError;
class InvalidRefreshTokenError extends Error {
    constructor(message = 'Invalid or expired refresh token') {
        super(message);
        this.name = 'InvalidRefreshTokenError';
    }
}
exports.InvalidRefreshTokenError = InvalidRefreshTokenError;
class TokenExpiredError extends Error {
    constructor(message = 'Expired refresh token') {
        super(message);
        this.name = 'TokenExpiredError';
    }
}
exports.TokenExpiredError = TokenExpiredError;
