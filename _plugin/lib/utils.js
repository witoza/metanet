"use strict";

class Options {
    constructor() {
        this.opts = Options.getDefault();
    }

    load(callback) {
        var that = this;
        chrome.storage.local.get('opts', function (result) {
            if (result.opts === undefined) {
                that.opts = Options.getDefault();
            } else {
                that.opts = result.opts;
            }
            if (callback) {
                callback(result);
            }
        });
    }

    static getDefault() {
        return {
            User: {
                uuid: guid(),
                username: "anonymous",
            }
        }
    }

    reset() {
        this.opts = Options.getDefault();
        this.save();
    }

    save() {
        chrome.storage.local.set({
            'opts': this.opts
        });
    }

}

function callAjax(qname, callOpts) {
    if (callOpts.beforeSend) callOpts.beforeSend();
    chrome.runtime.sendMessage({
        method: callOpts.method,
        action: 'xhttp',
        url: callOpts.url,
        data: JSON.stringify(callOpts.data)
    }, function (responseText) {
        if (responseText == null || responseText.length == 0) {
            callOpts.failure(responseText);
        } else {
            callOpts.success(responseText);
        }
    });
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
};