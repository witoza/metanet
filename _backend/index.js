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

Array.prototype.remove = function (predicate, beforeDelete) {
    var total = 0;
    for (var i = 0; i < this.length; i++) {
        if (predicate(this[i])) {
            if (beforeDelete != null) {
                beforeDelete(this[i]);
            }
            this.splice(i, 1);
            i--;
            total++;
        }
    }
    return total;
};


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

const STORAGE = require("./dummy").STORAGE;

app.post('/get_url_data', function (req, res, next) {

    const url = req.require_param("url");
    const R = {
        rooms: []
    };
    for (const room of STORAGE.rooms) {
        logger.debug("checking via: " + room.url);
        if (url.startsWith(room.url)) {
            logger.debug("match!");
            R.rooms.push(room);
        } else {
            logger.debug("not match");
        }
    }
    res.json(R);
});

app.post('/get_room_content', function (req, res, next) {
    const room_uuid = req.require_param("room_uuid");
    var rc = STORAGE.room_content[room_uuid];
    if (!rc) {
        STORAGE.room_content[room_uuid] = {
            data: []
        };
        rc = STORAGE.room_content[room_uuid];
    }
    res.json(rc.data);
});

app.post('/vote_room', function (req, res, next) {
    const room_uuid = req.require_param("room_uuid");
    const value = req.require_param("value");
    const room = STORAGE.rooms.find(room => room.uuid == room_uuid);
    if (room) {
        if (value > 0) {
            room.up_v++;
        } else {
            room.down_v--;
        }
    }
    res.json(room);
});

app.post('/create_room', function (req, res, next) {
    const room = req.body.room;

    const new_room = {
        uuid: room.uuid.trim(),
        url: room.url.toLowerCase().trim(),
        name: room.name.toLowerCase().trim(),
        owner: room.owner.trim(),
        up_v: 0,
        down_v: 0,
        karma_limit: room.karma_limit,
        created: Date.now(),
    };

    if (new_room.name === "") {
        res.status(400).json({
            msg: "name must not be empty"
        });
        return;
    }
    if (new_room.url.length < 10) {
        res.status(400).json({
            msg: "invalid url"
        });
        return;
    }
    if (STORAGE.rooms.find(room => room.name === new_room.name) != null) {
        res.status(400).json({
            msg: "room already exists"
        });
        return;
    }

    STORAGE.rooms.push(new_room);

    res.json(new_room);
})
;

app.post('/delete_room', function (req, res, next) {
    const room_uuid = req.require_param("room_uuid");
    delete STORAGE.room_content[room_uuid];
    STORAGE.rooms.remove(room => room.uuid = room_uuid);

    res.json({});
});

app.post('/post', function (req, res, next) {
    const body = req.body;
    const roomc = STORAGE.room_content[body.room_uuid];

    const item = Object.assign({time: Date.now()}, body.item);

    if (roomc) {
        roomc.data.push(item);
    } else {
        STORAGE.room_content[body.room_uuid] = {
            data: [item]
        }
    }

    res.json({});
});

const http_port = 7001;
const server = http.createServer(app).listen(http_port, function () {
    logger.info("Metanet backend is running at: " + http_port);
});
