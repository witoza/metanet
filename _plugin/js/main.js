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
        h_rooms += "<li><a id='" + room.m_uuid + "' href='javascript:void(0)'>" + key + "</a></li>"
    }

    const all_rooms = $(`
<div class="meta_all_rooms my_draggable">
    <div >
        <div class="my_resizable">
            <div>
               <b>Meta:</b><a href="javascript:void(0)" id="show_rooms"> Show rooms</a>
            </div>
             <div id="rooms">
                <ul>` + h_rooms + `</ul>
            </div>
        </div>
    </div>
</div>`);

    for (const key in rooms) {
        const room = rooms[key];
        all_rooms.find("#" + room.m_uuid).click(function () {
            console.log("X", room);

            const the_room = $(`
<div class="meta_room my_draggable">
    <div>
        <div class="my_resizable">
            <h1>Room: witoza</h1>
            
            <form action="demo_form.asp">
              First name: <input type="text" name="fname"><br>
              Last name: <input type="text" name="lname"><br>
              <input type="submit" value="Submit">
            </form>
        </div>
    </div>
</div>`);

            $("body").prepend(the_room);

            $('.my_draggable').draggable();
            $('.my_resizable').resizable();

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
    $('.my_draggable').draggable();
    $('.my_resizable').resizable();

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