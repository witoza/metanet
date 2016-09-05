"use strict";

var storage = chrome.storage.local;

function callAjax(qname, callOpts) {
    if (callOpts.beforeSend) callOpts.beforeSend();
    chrome.runtime.sendMessage({
        method: callOpts.method,
        action: 'xhttp',
        url: callOpts.url

    }, function (responseText) {
        if (responseText == null || responseText.length == 0) {
            callOpts.failure(responseText);
        } else {
            callOpts.success(responseText);
        }
    });
}

const user = {
    uuid: guid(),
    username: "witold"
};

$(document).ready(function () {

    console.log("hello there");

    let rooms = {
        'Default': {
            m_uuid: guid(),
            owner: user
        },
        'my_fun_room': {
            m_uuid: guid(),
            owner: user
        }
    };

    let h_rooms = "";
    for (const key in rooms) {
        let room = rooms[key];
        h_rooms += "<li><a id='" + room.m_uuid + "' href='javascript:void(0)'>" + key + "</a></li>"
    }

    const all_rooms = $(`
<div class="meta_all_rooms my_draggable">
   <b>Meta</b> <a href="javascript:void(0)" id="show_rooms">[show]</a>
    <div id="rooms">
        Public rooms:
        <ul>` + h_rooms + `</ul>
        My Rooms:
        <b><a href="javascript:void(0)" id="create_room">Create room</a></b>
    </div>
</div>`);

    all_rooms.find("#create_room").click(function () {

        console.log("new room");
    });

    const opened_rooms = {};

    for (const key in rooms) {
        const room = rooms[key];
        all_rooms.find("#" + room.m_uuid).click(function () {

            if (opened_rooms[room.m_uuid] === undefined) {
                opened_rooms[room.m_uuid] = {
                    top: 200,
                    left: 200,
                    content: ""
                }
            }

            const R = opened_rooms[room.m_uuid];
            if (R.visible) {
                R.elem.remove();
                delete R.elem;
                R.visible = false;
                return;
            }
            R.visible = true;

            const the_room = $(`
<div class="meta_room my_draggable">
        <div class="my_resizable">
        
            <div style="background-color: #f1a899; padding: 2px">
                <strong>` + key + " (owner " + room.owner.username + `)</strong>
                <strong style="float:right"><a href="javascript:void(0)" id="close">x</a>&nbsp;</strong>
            </div>
            <div class="my_clearfix"></div>
            Chat:
            <div style="border: 1px solid black; width: 100%; height: 200px; overflow:auto; background-color: white;" id="mcontent"></div>
            Say what:
            <input type="text" style="width: 100%; " id="saywhat"></input>
            
            <input type="submit" value="Send" id="send">
        </div>
</div>`);

            the_room.click(function () {
                console.log(room);
            });

            the_room.find("#close").on('click', function () {
                R.elem.remove();
                delete R.elem;
                R.visible = false;
            });

            the_room.find("#send").on('click', function () {
                console.log("send");
                const what = the_room.find("#saywhat").val();
                if (what == "") {
                    return;
                }

                R.content = "<p style='margin:2px;'><b>" + user.username + "</b>: " + what + "</p>" + R.content;

                the_room.find("#saywhat").val("");
                update_content();
            });

            function update_content() {
                the_room.find("#mcontent").html(R.content);
            }

            update_content();

            the_room.css({top: R.top, left: R.left, position: 'fixed'});

            $("body").prepend(the_room);

            the_room.draggable({
                stop: function (event, ui) {
                    R.top = $(this).offset().top;
                    R.left = $(this).offset().left;
                }
            });
            $('.my_resizable').resizable();

            R.elem = the_room;

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

});

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
};