"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestLogModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const requestLogSchema = new mongoose_1.default.Schema({
    ip: { type: String, required: true },
    url: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
});
requestLogSchema.index({ Ip: 1, url: 1, date: -1 });
exports.RequestLogModel = mongoose_1.default.model('RequestLog', requestLogSchema);
