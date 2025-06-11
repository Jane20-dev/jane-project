"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.videos = void 0;
const settings_1 = require("./settings");
//const app = express()
//const port = 3003
// app.use(bodyParser.urlencoded({ extended: false }));
//app.use(bodyParser.json());
exports.videos = [];
const availableResolutions = ['P144', 'P240', 'P360', 'P480', 'P720', 'P1080', 'P1440', 'P2160'];
settings_1.app.post('/videos', (req, res) => {
    const errorsMessages = [];
    const inputedData = req.body;
    if (!inputedData.title) {
        errorsMessages.push({ message: "Title is required", field: "title" });
    }
    else if (inputedData.title.length > 40) {
        errorsMessages.push({ message: "Title is required", field: "title" });
    }
    if (!inputedData.author) {
        errorsMessages.push({ message: "Author is required", field: "author" });
    }
    else if (inputedData.author.length > 20) {
        errorsMessages.push({ message: "Author is required", field: "author" });
    }
    // если элементы входнного массива не соответсвуют элементам эталонного массива , то кладем ошибку в errorsMessage
    // if (проверка) [ P144, P240, P360, P480, P720, P1080, P1440, P2160 ]
    if (!inputedData.availableResolutions.every((resolution) => availableResolutions.includes(resolution))) {
        errorsMessages.push({ message: "Invalid resolution provided", field: "availableResolutions" });
    }
    console.log({ length: inputedData.author.length });
    if (errorsMessages.length > 0) {
        return res.status(400).send({ errorsMessages });
    }
    const currentDate = new Date();
    const publicationDate = new Date(currentDate);
    publicationDate.setDate(currentDate.getDate() + 1);
    const newVideo = {
        id: Math.random(),
        title: inputedData.title,
        author: inputedData.author,
        availableResolutions: inputedData.availableResolutions,
        canBeDownloaded: false,
        minAgeRestriction: null,
        createdAt: new Date().toISOString(),
        publicationDate: publicationDate.toISOString()
    };
    exports.videos.push(newVideo);
    return res.status(201).send(newVideo);
});
settings_1.app.get('/videos/:id', (req, res) => {
    let video;
    for (let i = 0; i < exports.videos.length; i++) {
        if (exports.videos[i].id === +req.params.id) {
            video = exports.videos[i];
        }
    }
    if (video) {
        return res.status(200).send(video);
    }
    return res.sendStatus(404);
});
settings_1.app.get('/videos', (req, res) => {
    console.log({ videos: exports.videos });
    if (exports.videos.length > 0) {
        return res.status(200).send(exports.videos);
    }
    else {
        return res.status(404).send('No videos found');
    }
});
settings_1.app.put('/videos/:id', (req, res) => {
    const errors = [];
    const videoId = +req.params.id;
    const updatedVideo = req.body;
    if (updatedVideo.title === undefined || !updatedVideo.title === null || !(typeof updatedVideo.title === 'string') || updatedVideo.title.length > 40) {
        errors.push({ message: "Title is required", field: "title" });
    }
    if (updatedVideo.publicationDate === undefined || !updatedVideo.publicationDate === null || !(typeof updatedVideo.publicationDate === 'string') || isNaN(Date.parse(updatedVideo.publicationDate))) {
        errors.push({ message: "PublicationDate is required", field: "publicationDate" });
    }
    if (updatedVideo.author === undefined || !updatedVideo.author === null || !(typeof updatedVideo.author === 'string') || updatedVideo.author.length > 20) {
        errors.push({ message: "Author is required", field: "author" });
    }
    if (!updatedVideo.minAgeRestriction || isNaN(updatedVideo.minAgeRestriction) || updatedVideo.minAgeRestriction > 18 || updatedVideo.minAgeRestriction < 1) {
        errors.push({ message: "Min age restriction is required and must be a number", field: "minAgeRestriction" });
    }
    if (typeof updatedVideo.canBeDownloaded !== 'boolean') {
        errors.push({ message: "Can be downloaded field must be a boolean", field: "canBeDownloaded" });
    }
    if (errors.length > 0) {
        const errorResponse = { errorsMessages: errors };
        return res.status(400).json(errorResponse);
    }
    const videoIndex = exports.videos.findIndex(v => v.id === videoId);
    if (videoIndex !== -1) {
        exports.videos.splice(videoIndex, 1, { ...exports.videos[videoIndex], ...updatedVideo });
        return res.sendStatus(204);
    }
    else {
        return res.sendStatus(404);
    }
});
settings_1.app.delete('/videos/:id', (req, res) => {
    for (let i = 0; i < exports.videos.length; i++) {
        if (exports.videos[i].id === +req.params.id) {
            exports.videos.splice(i, 1);
            res.sendStatus(204);
            return;
        }
    }
    return res.sendStatus(404);
});
