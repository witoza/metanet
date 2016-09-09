"use strict";

const WURL = window.location.href;

function get_rooms() {
    return callAjaxPromise("rbt", {
        url: "/get_url_data",
        data: {
            url: WURL
        }
    });
}

function vote_room(room, value) {
    return callAjaxPromise("rbt", {
        url: "/vote_room",
        data: {
            room_uuid: room.uuid,
            value: value
        }
    });
}

function create_room(room) {
    return callAjaxPromise("rbt", {
        url: "/create_room",
        data: {
            url: WURL,
            room: room,
        },
    });
}

function get_room_content(room) {
    return callAjaxPromise("rbt", {
        url: "/get_room_content",
        data: {
            room_uuid: room.uuid
        },
    });
}

function post(room, item) {
    return callAjaxPromise("rbt", {
        url: "/post",
        data: {
            room_uuid: room.uuid,
            item: item
        }
    });
}

const myOPT = new Options();
myOPT.load();

var html_divs = $("<div></div>");

function augment(url_data) {
    const user = myOPT.opts.User;
    let rooms = url_data.rooms;

    function room_to_str(room) {
        let name = room.name;
        if (room.owner === user.uuid) {
            name = `#<b>${name}</b>`;
        }
        return `
<p style='margin:0px' id="${room.uuid}">&nbsp;&nbsp; 
    <a href='javascript:void(0)'>
        <span name="name">${name}</span>
    </a>
    &#8593;
    <span name="up_v" style="color: green">${room.up_v}</span>
    &#8595;
    <span name="down_v" style="color: red">${room.down_v}</span>
</p> `;
    }

    rooms.sort(function (r1, r2) {
        function ranking(r) {
            var v = 0;
            if (r.owner === user.uuid) {
                v += 10000;
            }
            v += r.up_v + r.down_v;
            return v;
        }

        return ranking(r1) < ranking(r2);
    });

    let html_direct_rooms = rooms
        .filter(room => room.url === WURL)
        .map(room_to_str)
        .join("");
    if (html_direct_rooms.length > 0) {
        html_direct_rooms = `<b>Direct:</b>${html_direct_rooms}`
    }

    let html_parents_rooms = rooms
        .filter(room => room.url != WURL)
        .map(room_to_str)
        .join("");

    if (html_parents_rooms.length > 0) {
        html_parents_rooms = `<b>Parents:</b>${html_parents_rooms}`
    }

    const all_rooms = $(`
<div class="meta_all_rooms my_draggable">
    <b>MetaNet (` + Object.keys(rooms).length + `)</b> <a href="javascript:void(0)" id="show_rooms">[show]</a>
    
    <div id="rooms">
         ${html_direct_rooms}
         ${html_parents_rooms}
         <br/>
        <p style='margin:0px'><b><a href="javascript:void(0)" id="create_room"> create room</a></b></p>
        <p style='margin:0px'><b><a target="_blank" href="` + chrome.extension.getURL("options.html") + `" target="_blank"> configure MetaNet</a></b></p>
    </div>
</div>`);

    let new_room_index = 0;
    all_rooms.find("#create_room").click(function () {
        console.log("new room");
        new_room_index++;
        if (new_room_index > 5) {
            new_room_index = 0;
        }

        let room = {
            uuid: guid(),
            owner: user.uuid,
            runtime: {
                top: 150 + (30) * new_room_index,
                left: 150 + (30) * new_room_index,
            }
        };

        const the_room = $(`
<div class="meta_room my_draggable" id="room_${room.uuid}">
    <div>
        <div class="mt_title" style="padding: 2px; font-family: monospace; color: black">
            <strong>Create new room</strong>
            <span style="float:right">
                <strong>
                    <span id="close">
                        <a href="javascript:void(0)" id="close">x</a>&nbsp;
                    </span> 
                </strong>
            </span>
        </div>
        <div class="my_clearfix"></div>
        <p></p>
        <p>Name: <input type="text" name="name" size="20" value="my_room"></p>
        <p>Matching URL: <input type="text" name="url" size="60" value="${WURL}"></p>
        <p>Minimum user's karma required to join: <input type="number" name="karma_limit" value="1"></p>
            
        <input type="button" value="Create" id="create">
    </div>
</div>`);

        html_divs.prepend(the_room);
        the_room.css({top: room.runtime.top, left: room.runtime.left, position: 'fixed'});
        the_room.find("#create").click(function () {
            console.log("create room");
            room.name = the_room.find("[name='name']").val();
            room.url = the_room.find("[name='url']").val();
            room.karma_limit = the_room.find("[name='karma_limit']").val();
            create_room(room).then(function () {
                console.log("room has been created");
                close_room(room);
                reload();
            })

        });
        the_room.find("#close").click(function () {
            close_room(room);
        });
        the_room.draggable({
            stop: function (event, ui) {
                room.runtime.top = $(this).offset().top;
                room.runtime.left = $(this).offset().left;
            }
        });
        the_room.resizable();
        the_room.click(function () {
            set_room_focus(room);
        });
        set_room_focus(room);

        room.runtime.elem = the_room;

    });

    function set_room_focus(room) {
        refresh_room_content(room);
        $(".meta_room").each(function (index, item) {
            let $item = $(item);
            let is_owner = $item.attr("is_owner") == "true";

            if ($item.attr("id") === "room_" + room.uuid) {
                $item.css({"opacity": "1", "z-index": 10000});
                if (!is_owner) {
                    $item.find(".mt_title").css({"background-color": "#ff6600"});
                } else {
                    $item.find(".mt_title").css({"background-color": "lightgreen"});
                }
            } else {
                const zi = parseInt($item.css("z-index"));
                $item.css({"opacity": "0.9", "z-index": zi - 1});
                $item.find(".mt_title").css({"background-color": "lightgray"});
            }
        });
    }

    function close_room(room) {
        console.log("close_room", room.name);
        room.runtime.elem.remove();
        delete room.runtime.elem;
        delete room.runtime.visible;
    }

    function refresh_room_content(room) {

        function update_content(content) {

            function format_date(d) {
                var s = d.getHours() + ":";
                if (d.getMinutes() < 9) {
                    s += "0"
                }
                s += d.getMinutes() + ":";
                if (d.getSeconds() < 9) {
                    s += "0"
                }
                s += d.getSeconds();
                return s;
            }

            const hi = content.map(function (item) {
                return "<p style='margin:2px; font-family: monospace;'>[" + format_date(new Date(item.time)) + "] &lt;<b>" + item.user + "</b>&gt; " + item.msg + "</p>";
            });
            const mcontent = room.runtime.elem.find("#mcontent");
            mcontent.html(hi.join(""));
            mcontent.scrollTop(mcontent[0].scrollHeight);
        }

        const check = room.runtime && room.runtime.visible;
        if (!check) {
            return;
        }
        console.log("refresh_room_content", room.name);
        get_room_content(room).then(function (content) {
            update_content(content);
        });
    }

    // setInterval(function () {
    //     rooms.forEach(refresh_room_content);
    // }, 5000);

    let index = 0;
    for (const room of rooms) {
        index++;

        const is_owner = room.owner === user.uuid;

        const _index = index;
        all_rooms.find("#" + room.uuid + " > a").click(function () {

                console.log("toggle_room", room.name);

                if (room.runtime === undefined) {
                    room.runtime = {
                        top: 150 + (30) * _index,
                        left: 150 + (30) * _index,
                    }
                }

                if (room.runtime.visible) {
                    close_room(room);
                    return;
                }
                room.runtime.visible = true;

                let toolbar = "";
                if (is_owner) {
                    toolbar = `
                        <span id="settings">
                           <a href="javascript:void(0)">settings</a>
                        </span>
                        |`;
                }

                const the_room = $(`
<div class="meta_room my_draggable" id="room_${room.uuid}" is_owner="${is_owner}">
    <div class="mt_title" style="padding: 2px; font-family: monospace; color: black">
        <strong>${room.name}</strong>
        <span style="float:right">
            <strong>
                 ${toolbar}
                <span id="info">
                   <a href="javascript:void(0)">info</a>
                </span>
                |
                <span id="close">
                    <a href="javascript:void(0)" id="close">x</a>&nbsp;
                </span> 
            </strong>
        </span>
    </div>
    <div class="my_clearfix"></div>
    This room is for <b>${room.url}</b><br/>
    <div style="border: 1px solid black; width: 100%; height: 400px; overflow:auto; background-color: white;" id="mcontent"></div>
    
    <div>
        Say what:
        <input type="text" style="width: 100%;" id="saywhat"></input>
        <span style="float:left">
            <input type="button" value="Send" id="send">
        </span>
        
        <span style="float:right">
            <input type="button" value=" &#8593; " id="up_vote" style="background-color: green; color: white;"> 
            <input type="button" value=" &#8595; " id="down_vote" style="background-color: red; color: white;"> 
        </span>
    </div>
</div>`);

                function update_room_meta(room) {
                    $("#" + room.uuid + " > span[name='up_v']").html(room.up_v);
                    $("#" + room.uuid + " > span[name='down_v']").html(room.down_v);
                    $("#" + room.uuid + " > span[name='name']").html(room.name);
                }

                the_room.find("#up_vote").click(function () {
                    vote_room(room, 1).then(update_room_meta);
                });
                the_room.find("#down_vote").click(function () {
                    vote_room(room, -1).then(update_room_meta);
                });
                the_room.click(function () {
                    set_room_focus(room);
                });
                the_room.find("#close").click(function () {
                    close_room(room);
                });
                the_room.find("#info").click(function () {
                    console.log("info");
                });
                the_room.find("#send").click(function () {
                    console.log("send");
                    const what = the_room.find("#saywhat").val();
                    the_room.find("#saywhat").val("");
                    if (what == "") {
                        return;
                    }

                    const item = {
                        user: user.uuid,
                        msg: what
                    };

                    post(room, item);
                });

                the_room.css({top: room.runtime.top, left: room.runtime.left, position: 'fixed'});

                html_divs.prepend(the_room);

                the_room.draggable({
                    stop: function (event, ui) {
                        room.runtime.top = $(this).offset().top;
                        room.runtime.left = $(this).offset().left;
                    }
                });
                the_room.resizable();

                room.runtime.elem = the_room;

                set_room_focus(room);

            }
        );
    }

    let hide_rooms = true;
    all_rooms.find("#rooms").hide();

    all_rooms.find("#show_rooms").click(function () {
        console.log("show rooms");

        if (hide_rooms) {
            myOPT.opts.Runtime.show_rooms = true;
            myOPT.save();
            all_rooms.find("#rooms").show();

            rooms.forEach(function (room) {
                if (room.runtime && room.runtime.visible) {
                    room.runtime.elem.show();
                }
            });
        } else {
            myOPT.opts.Runtime.show_rooms = false;
            myOPT.save();
            all_rooms.find("#rooms").hide();

            rooms.forEach(function (room) {
                if (room.runtime && room.runtime.visible) {
                    room.runtime.elem.hide();
                }
            });
        }
        hide_rooms = !hide_rooms;

    });

    html_divs.append(all_rooms);
    all_rooms.draggable();
    return all_rooms;
}

$("body").prepend(html_divs);

function reload() {

    html_divs.empty();
    get_rooms().then(function (url_data) {
        console.log("url_data", url_data);
        var all_rooms = augment(url_data);
        if (myOPT.opts.Runtime.show_rooms) {
            all_rooms.find("#show_rooms").click();
        }
    });
}

$(document).ready(function () {
    if (!inIframe()) {
        console.log("hello from metanet", WURL);
        reload();
    }
});
