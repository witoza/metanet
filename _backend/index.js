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

var STORAGE = {
    users: [],
    rooms: [],
    room_content: {}
};

const U_1 = {
    uuid: "user-uuid-1",
    username: "Witold Z",
};

const U_2 = {
    uuid: "user-uuid-2",
    username: "witold z",
};

const U_3 = {
    uuid: "user-uuid-3",
    username: "witoza",
};

STORAGE.rooms.push(
    {
        uuid: "room-uuid-1",
        url: "https://streambin.pl/*",
        name: 'Default',
        owner: U_1.uuid,
        up_v: 35,
        down_v: 3,
        karma_limit: 1,
        created: Date.now(),
    },
    {
        uuid: "room-uuid-2",
        url: "https://streambin.pl/*",
        name: 'my_fun',
        owner: U_2.uuid,
        up_v: 24,
        down_v: 3,
        karma_limit: 1,
        created: Date.now(),
    },
    {
        uuid: "room-uuid-3",
        url: "https://streambin.pl/*",
        name: 'plotki',
        owner: U_3.uuid,
        up_v: 98,
        down_v: 4,
        karma_limit: 1,
        created: Date.now(),
    }
);

STORAGE.room_content["room-uuid-1"] = {
    data: [
        {
            time: Date.now(),
            user: U_1.uuid,
            msg: "hello there",
        },
        {
            time: Date.now(),
            user: U_2.uuid,
            msg: "hi sir"
        },
        {
            time: Date.now(),
            user: U_3.uuid,
            msg: "im steave!"
        }
    ]
};

STORAGE.room_content["room-uuid-2"] = {
    data: []
};

STORAGE.users.push(U_1, U_2, U_3);

app.post('/get_url_data', function (req, res, next) {

    const url = req.require_param("url");
    const R = {
        rooms: []
    };
    for (const room of STORAGE.rooms) {
        R.rooms.push(room);
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

app.post('/create_room', function (req, res, next) {
    var room = req.body.room;

    var item = {
        uuid: room.uuid,
        url: room.matching_url,
        name: room.name,
        owner: room.owner,
        up_v: 0,
        down_v: 0,
        karma_limit: room.karma_limit,
        created: Date.now(),
    };

    STORAGE.rooms.push(item);

    res.json({});
});

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
