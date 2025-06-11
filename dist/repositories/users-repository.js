"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRepository = void 0;
const uuid_1 = require("uuid");
const db_1 = require("./db");
const db_2 = require("./db");
const startServer = async () => {
    await (0, db_1.runDb)();
};
startServer();
exports.usersRepository = {
    // Создание пользователя (POST /users)
    async createUser(login, email, passwordHash) {
        const newUser = {
            id: (0, uuid_1.v4)(),
            login,
            email,
            passwordHash,
            createdAt: new Date().toISOString(),
        };
        console.log('Inserting user:', newUser);
        await db_2.usersCollection.insertOne(newUser);
        return newUser;
    },
    async findUserByLogin(login) {
        return db_2.usersCollection.findOne({ login });
    },
    async findUserByEmail(email) {
        return db_2.usersCollection.findOne({ email });
    },
    async findUserByLoginOrEmail(loginOrEmail) {
        return db_2.usersCollection.findOne({
            $or: [{ login: loginOrEmail }, { email: loginOrEmail }],
        });
    },
    async deletedUserssbyId(id) {
        const result = await db_2.usersCollection.deleteOne({ id: id });
        return result.deletedCount > 0;
    },
    async findUsersList(query) {
        const { searchLoginTerm, searchEmailTerm, sortBy = 'createdAt', sortDirection = 'desc', pageNumber = 1, pageSize = 10, } = query;
        const filter = {};
        if (searchLoginTerm || searchEmailTerm) {
            filter.$or = [];
            if (searchLoginTerm) {
                filter.$or.push({ login: { $regex: searchLoginTerm, $options: 'i' } });
            }
            if (searchEmailTerm) {
                filter.$or.push({ email: { $regex: searchEmailTerm.replace(/\./g, '\\.'), $options: 'i' } });
            }
        }
        const sortOptions = {};
        if (sortBy) {
            sortOptions[sortBy] = sortDirection === 'desc' ? -1 : 1;
        }
        const users = await db_2.usersCollection
            .find(filter)
            .sort(sortOptions)
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .toArray();
        const totalCount = await db_2.usersCollection.countDocuments(filter);
        return {
            pagesCount: Math.ceil(totalCount / pageSize),
            page: pageNumber,
            pageSize: pageSize,
            totalCount,
            items: users.map((user) => ({
                id: user.id,
                login: user.login,
                email: user.email,
                createdAt: user.createdAt,
            })),
        };
    },
};
