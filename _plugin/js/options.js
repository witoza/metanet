"use strict";

const myOPT = new Options();

function populateOptions() {
    console.log("populateOptions", myOPT.opts);

    for (var categoryName in myOPT.opts) {
        let category = myOPT.opts[categoryName];

        for (var field in category) {
            let node = $("#" + categoryName).find('input[name=' + field + ']');
            let data_type = typeof (category[field]);

            if (data_type === "boolean") {
                node.attr('checked', category[field]);
            } else if (data_type === "string") {
                node.val(category[field]);
            } else {
                throw new Error("unknown data type: " + data_type)
            }
        }
    }
}

function saveOptions() {
    console.log("saveOptions");

    for (var categoryName in myOPT.opts) {
        let category = myOPT.opts[categoryName];
        for (var field in category) {
            let node = $("#" + categoryName).find('input[name=' + field + ']');
            let data_type = typeof (category[field]);

            if (data_type === "boolean") {
                category[field] = node.is(':checked');
            } else if (data_type === "string") {
                category[field] = node.val();
            } else {
                throw new Error("unknown data type: " + data_type)
            }
        }
    }
    myOPT.save();
}

function buildHtml() {
    console.log("buildHtml");

    var theBody = $("#body");
    var opts = Options.prototype.getDefault();
    for (var categoryName in opts) {
        theBody.append("<div id='" + categoryName + "'></div>");

        var category = opts[categoryName];
        var node = $("#" + categoryName);
        var htmlStr = "<fieldset><legend>" + categoryName.replace(/_/gi, " ") + "</legend>";

        for (var fieldName in category) {

            var typeOfNode = typeof (category[fieldName]);
            var humanReadable = fieldName.replace(/_/gi, " ");
            if (typeOfNode === "boolean") {
                htmlStr = htmlStr + ("<input name='" + fieldName + "' type='checkbox'>" + humanReadable + "</input>");
            } else if (typeOfNode === "string") {
                htmlStr = htmlStr + (humanReadable + " <input name='" + fieldName + "' type='text' size='40'/>");
            }
            htmlStr = htmlStr + ("<br/>");
        }

        htmlStr = htmlStr + "</fieldset>";
        node.append(htmlStr);
    }
}

function loadOptions() {
    myOPT.load(function (result) {
        try {
            populateOptions(result.opts);
        } catch (e) {
            console.log('error in loadOptions: ' + e);
        }
    });
}

$(document).ready(function () {

    $('#resetOptions').click(function () {
        myOPT.reset();
        loadOptions();
        alert("Reset!");
    });

    $('#saveOptions').click(function () {
        saveOptions();
        loadOptions();
        alert("Saved!");
    });

    buildHtml();
    loadOptions();
});

