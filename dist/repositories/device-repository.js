"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceRepository = exports.DeviceRepository = void 0;
const db_1 = require("../db/db");
class DeviceRepository {
    async createDeviceSession(sessionData) {
        try {
            await db_1.deviceSessionsCollection.insertOne(sessionData);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async getDevicesessionById(deviceId) {
        if (!db_1.deviceSessionsCollection) {
            return null;
        }
        try {
            const deviceSession = await db_1.deviceSessionsCollection.findOne({ deviceId: deviceId });
            return deviceSession;
        }
        catch (error) {
            return null;
        }
    }
    //ТОЛЬКО ТО ЧТО БЫЛО ПРОВЕРЕНО НА ПРИНАДЛЕЖНОСТЬ!!!
    async deleteBelongSession(deviceId) {
        if (!db_1.deviceSessionsCollection) {
            return false;
        }
        try {
            const result = await db_1.deviceSessionsCollection.deleteOne({ deviceId: deviceId });
            return result.deletedCount === 1;
        }
        catch (error) {
            return false;
        }
    }
    async findUserDeviceSessions(userId) {
        try {
            // Ищем все сессии, где userId соответствует
            const sessions = await db_1.deviceSessionsCollection.find({ userId: userId }).toArray();
            return sessions;
        }
        catch (error) {
            console.error('Error finding user device sessions:', error);
            return []; // Возвращаем пустой массив в случае ошибки
        }
    }
    async findDeviceSessionInDB(deviceId, userId, jti) {
        return await db_1.deviceSessionsCollection.findOne({ deviceId: deviceId, userId: userId, jti: jti });
    }
    async findAllActiveSessions(userId, deviceId) {
        const now = new Date();
        return await db_1.deviceSessionsCollection.findOne({ userId: userId, deviceId: deviceId });
    }
    async deleteDeviceSessionById(userId, deviceId) {
        const result = await db_1.deviceSessionsCollection.deleteOne({ userId: userId, deviceId: deviceId });
        return result.deletedCount === 1; // Возвращаем true, если был удален 1 документ
    }
    async deleteAllSessions(userId, currentDeviceId) {
        const result = await db_1.deviceSessionsCollection.deleteMany({
            userId: userId,
            deviceId: { $ne: currentDeviceId }
        });
        console.log(`[deviceRepo.deleteAllSessions] Mongo удалила документов: ${result.deletedCount}`);
        return result.deletedCount > 0;
    }
    async updateSession(deviceId, newExpiresAt) {
        const result = await db_1.deviceSessionsCollection.updateOne({ deviceId: deviceId }, { $set: { expiresAt: newExpiresAt, lastActiveDate: new Date() } });
        return result.modifiedCount === 1;
    }
    async deleteThisOldSession(jti) {
        try {
            const result = await db_1.deviceSessionsCollection.deleteOne({ jti: jti });
            const isDeleted = result.deletedCount > 0;
            return isDeleted;
        }
        catch (error) {
            return false;
        }
    }
}
exports.DeviceRepository = DeviceRepository;
exports.deviceRepository = new DeviceRepository();
//другие методы delete  и тд
