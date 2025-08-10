"use strict";
// import mongoose from 'mongoose';
// import { DeviceSessionType } from '../db';
// const securityDeviceSchema = new mongoose.Schema({
//   userId: { type: String, required: true }, // К какому пользователю относится сессия
//   deviceId: { type: String, required: true, unique: true }, // Уникальный ID этой сессии (из Refresh Token'а)
//   ip: { type: String, required: true }, // IP-адрес, с которого был логин
//   deviceName: { type: String, required: true }, // Название устройства (из User-Agent)
//   issuedAt: { type: Date, required: true }, // Время создания Refresh Token
//   expiresAt: { type: Date, required: true }, // Время истечения Refresh Token
// });
// export const SecurityDeviceModel = mongoose.model<DeviceSessionType>('SecurityDevice', securityDeviceSchema);
