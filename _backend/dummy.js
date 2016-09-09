const Chance = require('chance'), chance = new Chance();
const uuid = require('uuid');

const STORAGE = {
    users: [],
    rooms: [],
    room_content: {}
};

const U_1 = {
    uuid: "user-uuid-1",
    username: "Witold Z",
    karma: 1,
};

const U_2 = {
    uuid: "user-uuid-2",
    username: "witold z",
    karma: 1,
};

const U_3 = {
    uuid: "user-uuid-3",
    username: "witoza",
    karma: 1,
};

STORAGE.rooms.push(
    {
        uuid: "room-uuid-1",
        url: "https://streambin.pl/",
        name: 'default',
        owner: U_1.uuid,
        up_v: 35,
        down_v: -3,
        karma_limit: 1,
        created: Date.now(),
    },
    {
        uuid: "room-uuid-2",
        url: "https://streambin.pl/",
        name: 'my_fun',
        owner: U_2.uuid,
        up_v: 24,
        down_v: -3,
        karma_limit: 1,
        created: Date.now(),
    },
    {
        uuid: "room-uuid-3",
        url: "http://exploringjs.com/es6/",
        name: 'plotki',
        owner: U_3.uuid,
        up_v: 98,
        down_v: -4,
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
STORAGE.votes = [];

exports.STORAGE = STORAGE;