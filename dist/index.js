"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startApp = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const blogs_1 = require("./routes/blogs");
const posts_1 = require("./routes/posts");
const users_1 = require("./routes/users");
const auth_1 = require("./routes/auth");
const comments_1 = require("./routes/comments");
const db_1 = require("./db/db");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const security_1 = require("./routes/security");
exports.app = (0, express_1.default)();
const port = 3000;
exports.app.set('trust proxy', true);
exports.app.use((0, cookie_parser_1.default)());
exports.app.use(body_parser_1.default.json());
exports.app.use('/security', security_1.securityRoute);
exports.app.use('/auth', auth_1.authRoute);
exports.app.use('/blogs', blogs_1.blogRoute);
exports.app.use('/posts', posts_1.postRoute);
exports.app.use('/users', users_1.userRoute);
exports.app.use('/comments', comments_1.commentRoute);
exports.app.delete('/testing/all-data', async (req, res) => {
    console.log('Clearing all data');
    await db_1.postsCollection.deleteMany({});
    await db_1.blogCollection.deleteMany({});
    await db_1.usersCollection.deleteMany({});
    await db_1.commentsCollection.deleteMany({});
    await db_1.deviceSessionsCollection.deleteMany({});
    return res.sendStatus(204);
});
const startApp = async () => {
    try {
        // Сначала ждем подключения к БД
        await (0, db_1.runDb)();
        console.log('Connected successfully to database');
        // Возвращаем Promise, который разрешится, когда сервер будет готов
        return new Promise((resolve) => {
            exports.app.listen(port, () => {
                console.log('Example app listening on port :' + port);
                resolve(); // Разрешаем Promise, когда сервер начал слушать порт
            });
        });
    }
    catch (error) {
        console.error('Failed to connect to database:', error);
        process.exit(1);
    }
};
exports.startApp = startApp;
// const startApp = async()=>{
//     await runDb()
// }
// app.listen(port, ()=> {
//     console.log('Example app listening on port :' + port)
// })
(0, exports.startApp)();
