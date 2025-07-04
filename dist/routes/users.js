"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoute = void 0;
const express_1 = require("express");
const users_repository_1 = require("../repositories/users-repository");
const user_service_1 = require("../services/user-service");
exports.userRoute = (0, express_1.Router)();
const checkBasicAuth = (req, res) => {
    const isHeaders = req.headers['authorization'];
    if (!isHeaders || !isHeaders.startsWith('Basic')) {
        res.status(401).send('Unauthorized');
        return false;
    }
    const base64Credentials = isHeaders.split(' ')[1];
    const loginDetails = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = loginDetails.split(':');
    if (username !== 'admin' || password !== 'qwerty') {
        res.status(401).send('Unauthorized');
        return false;
    }
    return true;
};
exports.userRoute.get('/', async (req, res) => {
    if (!checkBasicAuth(req, res))
        return;
    const { searchLoginTerm, searchEmailTerm, sortBy = 'createdAt', sortDirection = 'desc', pageNumber = '1', pageSize = '10' } = req.query;
    try {
        const users = await users_repository_1.usersRepository.findUsersList({
            searchLoginTerm: searchLoginTerm,
            searchEmailTerm: searchEmailTerm,
            sortBy: sortBy,
            sortDirection: sortDirection,
            pageNumber: parseInt(pageNumber),
            pageSize: parseInt(pageSize),
        });
        res.status(200).json(users);
    }
    catch (error) {
        console.error('Error in GET /users:', error);
        res.status(401).json({ error: 'Unauthorized' });
    }
});
exports.userRoute.post('/', async (req, res) => {
    if (!checkBasicAuth(req, res))
        return;
    const { login, email, password } = req.body;
    const errorsMessages = [];
    // Валидация login
    if (!login || login.trim().length === 0 || login.length < 3 || login.length > 10 || !/^[a-zA-Z0-9_-]*$/.test(login)) {
        errorsMessages.push({ message: 'not valid login', field: 'login' });
    }
    // Валидация email
    if (!email || email.trim().length === 0 || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        errorsMessages.push({ message: 'not valid email', field: 'email' });
    }
    // Валидация password
    if (!password || typeof password !== 'string' || password.trim().length === 0 || password.length < 6 || password.length > 20) {
        errorsMessages.push({ message: 'not valid password', field: 'password' });
    }
    if (errorsMessages.length > 0) {
        return res.status(400).send({ errorsMessages });
    }
    try {
        const result = await user_service_1.userService.registerUser(login, email, password);
        if ('errorsMessages' in result) {
            return res.status(400).json(result);
        }
        res.status(201).json({
            id: result.id,
            login: result.login,
            email: result.email,
            createdAt: result.createdAt,
        });
    }
    catch (error) {
        console.log('Error creating user:', error);
        res.status(500).send('Error creating user');
    }
    return true;
});
exports.userRoute.delete('/:id', async (req, res) => {
    if (!checkBasicAuth(req, res))
        return;
    const { id } = req.params;
    try {
        const deleted = await users_repository_1.usersRepository.deletedUserssbyId(id);
        if (!deleted) {
            return res.sendStatus(404);
        }
        res.sendStatus(204);
    }
    catch (error) {
        res.status(500).send('Error deleting user');
    }
    return true;
});
