"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitMiddleware = void 0;
const request_log_models_1 = require("../db/mongoDB/request-log-models");
const MAX_REQUESTS = 5; // Максимум 5 запросов
const TIME_WINDOW_MS = 10 * 1000; // За 10 секунд
const rateLimitMiddleware = async (req, res, next) => {
    const ip = req.ip || 'unknown';
    const url = req.originalUrl;
    const currentTime = new Date();
    try {
        // 1. Логирование запроса
        await request_log_models_1.RequestLogModel.create({
            ip: ip,
            url: url,
            date: currentTime,
        });
        // 2. Подсчёт запросов за последние 10 секунд
        const tenSecondsAgo = new Date(currentTime.getTime() - TIME_WINDOW_MS);
        const requestCount = await request_log_models_1.RequestLogModel.countDocuments({
            ip: ip,
            url: url,
            date: { $gte: tenSecondsAgo },
        });
        // 3. Проверка лимита
        if (requestCount > MAX_REQUESTS) {
            return res.status(429).send('Too Many Requests');
        }
        next();
    }
    catch (error) {
        console.error('Error in rateLimitMiddleware:', error);
        next();
    }
};
exports.rateLimitMiddleware = rateLimitMiddleware;
