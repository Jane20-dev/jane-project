"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityDeviceModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const securityDeviceSchema = new mongoose_1.default.Schema({
    userId: { type: String, required: true }, // К какому пользователю относится сессия
    deviceId: { type: String, required: true, unique: true }, // Уникальный ID этой сессии (из Refresh Token'а)
    ip: { type: String, required: true }, // IP-адрес, с которого был логин
    deviceName: { type: String, required: true }, // Название устройства (из User-Agent)
    issuedAt: { type: Date, required: true }, // Время создания Refresh Token
    expiresAt: { type: Date, required: true }, // Время истечения Refresh Token
});
exports.SecurityDeviceModel = mongoose_1.default.model('SecurityDevice', securityDeviceSchema);
