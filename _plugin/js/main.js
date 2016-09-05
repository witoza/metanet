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

$(document).ready(function () {

    console.log("hello there");

    let rooms = {
        'Default': {
            m_uuid: guid()
        },
        'my_fun_room': {
            m_uuid: guid()
        }
    };

    let h_rooms = "";
    for (const key in rooms) {
        let room = rooms[key];
        h_rooms += "<div id='" +room.m_uuid+"'>"+key+"</div>"
    }


    var show_rooms = $(`
<div class="meta_m">
    <div id="show_rooms">
        Rooms
    </div>
    
     <div id="rooms">
`
        + h_rooms +
`
    </div>
    
</div>
  `);

    let hide_rooms = true;
    show_rooms.find("#rooms").hide();

    show_rooms.find("#show_rooms").click(function () {
        console.log("show rooms")

        if (hide_rooms) {
            show_rooms.find("#rooms").show();
        } else {
            show_rooms.find("#rooms").hide();
        }
        hide_rooms = !hide_rooms;

    });

    $("body").append(show_rooms);


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