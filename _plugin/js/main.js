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
  
  var md = `
  <div class="meta_m">
	Rooms
  </div>
  `;
  
  $("body").append(md)
  
  
  
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