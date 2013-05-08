path = '/static/'
function debug(smt) {
    console.log(smt);
}
$(document).ready(function () {
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && sameOrigin(settings.url)) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
//    $('body').off('.data-api');
    $("#messageButton").click(function () {
        $("#messageModal").modal('show');
        $("#myTab .active a").click();
    });
    $('#myTab a').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
        if ($(this).attr("id") == "in") {
            getMessage("in", 0);
        } else if ($(this).attr("id") == "out") {
            getMessage("out", 0);
        }
    });
    castPage();
});

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
var csrftoken = getCookie('csrftoken');
function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}
function sameOrigin(url) {
    // test that a given url is a same-origin URL
    // url could be relative or scheme relative or absolute
    var host = document.location.host; // host + port
    var protocol = document.location.protocol;
    var sr_origin = '//' + host;
    var origin = protocol + sr_origin;
    // Allow absolute or scheme relative URLs to same origin
    return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
        (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
        // or any other URL that isn't scheme relative or absolute i.e relative.
        !(/^(\/\/|http:|https:).*/.test(url));
}


function markGood(cg, text) {
    $(cg).removeClass("error");
    $(cg).addClass("success");
    $(cg + " .help-inline").html(text);
}
function markBad(cg, text) {
    $(cg).removeClass("success");
    $(cg).addClass("error");
    $(cg + " .help-inline").html(text);
}

function getMessage(mType, isRead) {
    $.ajax({
        type: "POST",
        url: "/getMessages",
        data: JSON.stringify({
            'mType': mType,
            'isRead': isRead}),
        dataType: "json",
        success: function (data) {
            if (parseInt(data.info) == 1) {
                switch (mType) {
                    case "in":
                        addInMessage(data.messages);
                        break;
                    case "out":
                        addOutMessage(data.messages);
                        break;
                    default:
                        break;
                }
            } else if (parseInt(data.info) == 3) {
                debug("ошибка");
            }
        },
        error: function () {
            debug("ошибка сервера")
        }
    });
}

function addInMessage(messages) {
    $("#table-msg .table-body").html("");
    var k = messages.length;
    for (i = 0; i < k; i++) {
        $("#table-msg .table-body").prepend(fomatMessage(messages[i], "in"));
    }
}
function addOutMessage(messages) {
    $("#table-msg .table-body").html("");
    var k = messages.length;
    for (i = 0; i < k; i++) {
        $("#table-msg .table-body").prepend(fomatMessage(messages[i], "out"));
    }
}

function fomatMessage(mess, mtio) {
    yes_i = '<i class="icon-ok-circle icon-white icon-large"></i>';
    no_i = '<i class="icon-ban-circle icon-white icon-large"></i>';
    que_i = '<i class="icon-time icon-white icon-large"></i>';
    yes_b = '<button class="btn btn-mini" onclick="replyMessage(' + mess[0] + ',1,0)">' +
        '<i class="icon-ok icon-white icon-large"></i></button>';
    no_b = '<button class="btn btn-mini" onclick="replyMessage(' + mess[0] + ',2,0)">' +
        '<i class="icon-ban icon-white icon-large"></i></button>';
    ch_b = '<button class="btn btn-mini" onclick="replyMessage(' + mess[0] + ',1,1)">' +
        '<i class="icon-ok-circle icon-white icon-large"></i></button>' +
        '<button class="btn btn-mini" onclick="replyMessage(' + mess[0] + ',2,1)">' +
        '<i class="icon-ban-circle icon-white icon-large"></i></button>';


    listed = '<tr id="mess' + mess[0] + '">';
    listed += '<td>' + mess[3] + '</td>';
    listed += '<td>' + mess[4] + '</td>';
    listed += '<td>' + mess[1] + '</td>';
    listed += '<td>' + (new Date(Date.parse(mess[5]))).toLocaleString() + '</td>';

    listed += '<td>' + mess[7] + '</td>';

    listed += '<td class="c-icon-td">';
    if (mtio == "in") {
        if (mess[6] == 2) {
            listed += no_i;
        } else if (mess[7] < mess[2]) {
            listed += que_i;
        } else {
            listed += yes_i;
        }
        if ((mess[7] == mess [2]) || (mess[6]==2)) {
            listed += '</td><td  class="r-btn-td">' + yes_b + '</td>';
        } else {
            listed += '</td><td  class="r-btn-td">' + ch_b + '</td>';
        }
    } else if (mtio == "out") {
        if (mess[6] == 2) {
            listed += no_i;
        } else if (mess[7] < mess[2]) {
            listed += que_i;
        } else {
            listed += yes_i;
        }
        listed += '</td><td>&nbsp';
    }
    listed += '</td></tr>';
    return listed;
}


function replyMessage(mess_id, resp, mt) {
    $.ajax({
        type: "POST",
        url: "/replyMessage",
        data: JSON.stringify({
            'mess_id': mess_id,
            'resp': resp}),
        dataType: "json",
        success: function (data) {
            if (parseInt(data.info) == 1) {
                $("#mess" + mess_id).remove();
            } else if (parseInt(data.info) == 3) {
                debug("ошибка");
            }
        },
        error: function () {
            debug("ошибка сервера")
        }
    });
}
