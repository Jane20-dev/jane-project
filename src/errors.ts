export class DeviceNotfoundError extends Error{
    constructor(message = 'Device session not found'){
        super(message);
        this.name = 'DeviceNotFoundError';
    }
    
}

export class DeviceNotOwnedError extends Error {
    constructor(message = 'Device session belongs to another user') {
        super(message);
        this.name = 'DeviceNotOwnedError';
    }
}

export class InvalidRefreshTokenError extends Error {
    constructor(message = 'Invalid or expired refresh token') {
        super(message);
        this.name = 'InvalidRefreshTokenError';
    }
}

export class TokenExpiredError extends Error{
    constructor(message = 'Expired refresh token'){
        super(message);
        this.name = 'TokenExpiredError'
    }
}