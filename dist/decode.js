"use strict";
// Кодирование
const credentials = 'admin:qwerty';
const base64Credentials = Buffer.from(credentials).toString('base64'); // Результат: YWRtaW46cXdlcnR5
// Декодирование
const decodedCredentials = Buffer.from(base64Credentials, 'base64').toString('ascii'); // Результат: admin:qwerty
// монго дб  =>   mongodb+srv://Jane:<db_password>@cluster0.06u0o.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
