"use strict";

const http = require('http');
const express = require('express');
const fs = require('fs');
const path = require('path');
const log4js = require('log4js');
const bodyParser = require('body-parser');
const Chance = require('chance'), chance = new Chance();
const uuid = require('uuid');

const logger = log4js.getLogger();

String.prototype.startsWithAny = function () {
    return Array.prototype.some.call(arguments, arg => this.startsWith(arg));
};

String.prototype.endsWithAny = function () {
    return Array.prototype.some.call(arguments, arg => this.endsWith(arg));
};

http.IncomingMessage.prototype.require_param = function (name) {
    var val = this.get_param(name);
    if (val === undefined) {
        throw new Error("missing required parameter: " + name);
    }
    return val;
};

http.IncomingMessage.prototype.get_param = function (name) {
    return this.body[name] || this.params[name] || this.query[name];
};


const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var req_id = 0;

function is_req_static(req) {
    var url = req.originalUrl;

    var is_resource_static =
        url === "/" ||
        url.startsWithAny("/_bc/", "/_pc/", "/.well-known/") ||
        url.endsWithAny("js", "jpg", "ico", "png", "css", "html");

    return is_resource_static;
}

app.use('/', function (req, res, next) {

    if (is_req_static(req)) {
        next();
        return;
    }

    req_id++;
    req.req_id = req_id + "]";

    logger.info(req.req_id, "-----------------------------------");

    logger.info(req.req_id, ">", req.method, req.originalUrl);
    if (Object.keys(req.body).length > 0) {
        logger.info(req.req_id, "body:", req.body);
    }
    res.on('finish', function () {
        logger.info(req.req_id, "<", res.statusCode);
    });
    next();
});

var STORAGE = {
    users: {
        data: []
    },
    rooms: []
};

const u1 = {
    uuid: uuid.v4(),
    username: "Witold Z",
};

const u2 = {
    uuid: uuid.v4(),
    username: "witold z",
};

const u3 = {
    uuid: uuid.v4(),
    username: "witoza",
};


STORAGE.rooms.push(
    {
        uuid: uuid.v4(),
        url: "https://streambin.pl/*",
        name: 'Default',
        owner: u1.uuid,
        content: [
            {
                user: u1.uuid,
                msg: "hello there"
            },
            {
                user: u2.uuid,
                msg: "hi sir"
            },
            {
                user: u3.uuid,
                msg: "im steave!"
            }
        ]
    },
    {
        uuid: uuid.v4(),
        url: "https://streambin.pl/*",
        name: 'my_fun',
        owner: u2.uuid,
        content: []
    },
    {
        uuid: uuid.v4(),
        url: "https://streambin.pl/*",
        name: 'plotki',
        owner: u3.uuid,
        content: []
    }
);

STORAGE.users.data.push(u1, u2, u3);

app.post('/get_url_data', function (req, res, next) {

    const url = req.require_param("url");

    const R = {};
    R.rooms = STORAGE.rooms;
    for (const room of R.rooms) {
        for (const item of room.content) {
        }
    }

    res.json(R);
});

app.post('/post', function (req, res, next) {

    var body = req.body;

    const room_uuid = body.room_uuid;

    const room = STORAGE.rooms.find(room => room.uuid == room_uuid);
    if (room) {
        room.content.push(body.item);
    }
    
    res.end();
});

app.post('/get_user_data', function (req, res, next) {

    const m_uuid = req.require_param("m_uuid");

    const R = {};
    res.json(R);
});

const http_port = 7001;
const server = http.createServer(app).listen(http_port, function () {
    logger.info("Metanet backend is running at: " + http_port);
});
