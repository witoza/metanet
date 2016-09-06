"use strict";

const SERVER_URL = "http://127.0.0.1:7001";

function get_rooms() {
    return new Promise(function (resolve, reject) {
        callAjax("rbt", {
            method: "POST",
            url: SERVER_URL + "/get_url_data",
            data: {
                url: window.location.href
            },
            failure: function (err) {
                reject(err);
            },
            success: function (data) {
                resolve(JSON.parse(data));
            }
        });
    });
}

function post(room, item) {
    callAjax("rbt", {
        method: "POST",
        url: SERVER_URL + "/post",
        data: {
            room_uuid: room.uuid,
            item: item
        }
    });
}

const myOPT = new Options();
myOPT.load();

function augment(url_data) {
    let rooms = url_data.rooms;

    let html_rooms = "";
    for (const room of rooms) {
        html_rooms += "<li><a id='" + room.uuid + "' href='javascript:void(0)'>" + room.name + "</a></li>"
    }

    var href = chrome.extension.getURL("options.html");

    const all_rooms = $(`
<div class="meta_all_rooms my_draggable">
   <b>Meta (` + Object.keys(rooms).length + `)</b> <a href="javascript:void(0)" id="show_rooms">[show]</a>
    <div id="rooms">
        <a target="_blank" href="` + href + `" target="_blank">Configure</a>
        <br/>
            
        Public rooms:
        <ul>` + html_rooms + `</ul>
        My Rooms:
        
        <br/>
        <b><a href="javascript:void(0)" id="create_room">Create room</a></b>
    </div>
</div>`);

    all_rooms.find("#create_room").click(function () {
        console.log("new room");
    });

    var set_room_focus = function (active_room) {
        $(".meta_room").each(function (index, item) {
            var $item = $(item);

            if ($item.attr("id") === "room_" + active_room.uuid) {
                $item.css({"opacity": "0.97", "z-index": 10000});
                $item.find(".mt_title").css({"background-color": "#f1a899"});
            } else {
                const zi = parseInt($item.css("z-index"));
                $item.css({"opacity": "0.9", "z-index": zi - 1});
                $item.find(".mt_title").css({"background-color": "lightgray"});
            }
        });
    };

    let index = 0;

    setInterval(function () {
        for (const room of rooms) {
            const check = room.runtime && room.runtime.visible;
            if (!check) {
                continue;
            }
            console.log("get data for room", room.name);
        }
    }, 4000);

    for (const room of rooms) {
        index++;

        const _index = index;
        all_rooms.find("#" + room.uuid).click(function () {

            console.log("toggle_room", room.name);

            function close_room() {
                console.log("close_room", room.name);
                room.runtime.elem.remove();
                delete room.runtime.elem;
                delete room.runtime.visible;
            }

            if (room.runtime === undefined) {
                room.runtime = {
                    top: 150 + (30) * _index,
                    left: 150 + (30) * _index,
                }
            }

            if (room.runtime.visible) {
                close_room();
                return;
            }
            room.runtime.visible = true;

            const the_room = $(`
<div class="meta_room my_draggable" id="room_` + room.uuid + `">
    <div>
    
        <div class="mt_title" style="padding: 2px">
            <strong>` + room.name + " (owner " + room.owner + `)</strong>
            <strong style="float:right"><a href="javascript:void(0)" id="close">x</a>&nbsp;</strong>
        </div>
        <div class="my_clearfix"></div>
        Matching URL: <b>` + room.url + `</b><br/>
        Chat:
        <div style="border: 1px solid black; width: 100%; height: 200px; overflow:auto; background-color: white;" id="mcontent"></div>
        Say what:
        <input type="text" style="width: 100%;" id="saywhat"></input>
        
        <input type="submit" value="Send" id="send">
    </div>
</div>`);

            the_room.click(function () {
                set_room_focus(room);
            });

            the_room.find("#close").click(close_room);

            the_room.find("#send").click(function () {
                console.log("send");
                const what = the_room.find("#saywhat").val();
                the_room.find("#saywhat").val("");
                if (what == "") {
                    return;
                }

                const item = {
                    user: myOPT.opts.User.uuid,
                    msg: what
                };

                post(room, item);
                update_content();
            });

            function update_content() {
                var hi = room.content.map(function (item) {
                    return "<p style='margin:2px;'><b>" + item.user + "</b>: " + item.msg + "</p>";
                });
                the_room.find("#mcontent").html(hi.join(""));
            }

            update_content();

            the_room.css({top: room.runtime.top, left: room.runtime.left, position: 'fixed'});

            $("body").prepend(the_room);

            the_room.draggable({
                stop: function (event, ui) {
                    room.runtime.top = $(this).offset().top;
                    room.runtime.left = $(this).offset().left;
                }
            });
            the_room.resizable();

            room.runtime.elem = the_room;

            set_room_focus(room);

        });
    }

    let hide_rooms = true;
    all_rooms.find("#rooms").hide();

    all_rooms.find("#show_rooms").click(function () {
        console.log("show rooms");

        if (hide_rooms) {
            all_rooms.find("#rooms").show();
        } else {
            all_rooms.find("#rooms").hide();
        }
        hide_rooms = !hide_rooms;

    });

    $("body").prepend(all_rooms);
    all_rooms.draggable();
}

$(document).ready(function () {
    console.log("hello from metanet");
    get_rooms().then(function (url_data) {
        console.log("url_data", url_data);
        augment(url_data);
    });
});
