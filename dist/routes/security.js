"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityRoute = void 0;
const express_1 = require("express");
const auth_service_1 = require("../services/auth-service");
const auth_1 = require("./auth");
const errors_1 = require("../errors");
exports.securityRoute = (0, express_1.Router)();
exports.securityRoute.get('/devices', auth_1.authenticateToken, async (req, res) => {
    try {
        const sessions = await auth_service_1.userService.getUserActiveSessions(req.userPayload.userId);
        if (!sessions) {
            return res.status(200).json([]);
        }
        res.status(200).json(sessions);
    }
    catch (error) {
        res.status(500).send('Internal Server Error while fetching sessions');
    }
    return true;
});
exports.securityRoute.delete('/devices/:deviceId', auth_1.authenticateToken, async (req, res) => {
    var _a;
    const deviceIdToDelete = req.params.deviceId;
    const userId = (_a = req.userPayload) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId) {
        return res.status(401).send({ message: 'User ID is missing' });
    }
    if (!deviceIdToDelete) {
        return res.status(400).send({ message: 'Device ID is required in URL parameter' });
    }
    try {
        const isdDeleted = await auth_service_1.userService.deletedDevicebyId(userId, deviceIdToDelete);
        if (isdDeleted) {
            return res.status(204).send();
            // }else{
            //     return res.status(403).send({message: 'Forbidden: Cannot delete device belonging to another user or device not found'})
        }
    }
    catch (error) {
        if (error instanceof errors_1.DeviceNotfoundError) {
            return res.status(404).send({ message: error.message });
        }
        if (error instanceof errors_1.DeviceNotOwnedError) {
            return res.status(403).send({ message: error.message });
        }
        console.error('Error deleting session:', error);
        res.status(500).send('Error deleting this session');
    }
    return true;
});
exports.securityRoute.delete('/devices', auth_1.authenticateToken, async (req, res) => {
    var _a, _b, _c, _d;
    console.log(`[DELETE /devices] Запрос на удаление. userId из токена: ${(_a = req.userPayload) === null || _a === void 0 ? void 0 : _a.userId}, currentDeviceId из токена: ${(_b = req.userPayload) === null || _b === void 0 ? void 0 : _b.deviceId}`);
    if (!req.userPayload) {
        return res.status(401).send({ message: 'User payload missing' });
    }
    const userId = (_c = req.userPayload) === null || _c === void 0 ? void 0 : _c.userId;
    const currentDeviceId = (_d = req.userPayload) === null || _d === void 0 ? void 0 : _d.deviceId;
    try {
        const deleteSessions = await auth_service_1.userService.deleteAllSesions(userId, currentDeviceId);
        console.log(`[DELETE /devices] userService.deleteAllSesions вернул: ${deleteSessions}`);
        if (!deleteSessions) {
            return res.status(204).send();
        }
        else {
            return res.status(204).send();
        }
    }
    catch (error) {
    }
    return true;
});
