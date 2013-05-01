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
        getMessage("in", 0);
        getMessage("out", 0);

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
    $("#table-in .table-body").html("");
    var k = messages.length;
    for (i = 0; i < k; i++) {
        mess = messages[i];

        listed = '<tr id="mess' + mess[0] + '">';
        listed += '<td>' + mess[3] + '</td>';
        listed += '<td>' + mess[4] + '</td>';
        listed += '<td>' + mess[1] + '</td>';
        listed += '<td>' + (new Date(Date.parse(mess[5]))).toLocaleString() + '</td>';

        listed += '<td>' + mess[7] + '</td>';

        listed += '<td>';


        if (mess[7] % 2 == 0) {
            if (mess[7] == mess[2]) {
                if (mess[6] == 1) {
                    listed += '<i class="icon-ok-circle icon-white"></i>';
                } else if (mess[6] == 2) {
                    listed += '<i class="icon-ban-circle icon-white"></i>';
                }
            } else {
                listed += '<i class="icon-question-sign icon-white"></i>';
            }
            listed += '</td><td>&nbsp</td>';
        } else {
            if (mess[7] == mess[2]) {
                if (mess[6] == 1) {
                    listed += '<i class="icon-ok-circle icon-white"></i>';
                } else if (mess[6] == 2) {
                    listed += '<i class="icon-ban-circle icon-white"></i>';
                }
                listed += '</td><td>';
                listed += '<button class="btn btn-mini" onclick="replyMessage(' + mess[0] + ',1)">' +
                    '<i class="icon-ok-circle icon-white"></i></button>';
                listed += '</td>';
            } else {
                listed += '<i class="icon-question-sign icon-white"></i>';
                listed += '</td><td>';
                listed += '<div class="btn-group">';
                listed += '<button class="btn btn-mini" onclick="replyMessage(' + mess[0] + ',1)">' +
                    '<i class="icon-ok-circle icon-white"></i></button>';
                listed += '<button class="btn btn-mini" onclick="replyMessage(' + mess[0] + ',2)">' +
                    '<i class="icon-ban-circle icon-white"></i></button>';
                listed += '</div>';

            }
        }

        listed += '</td>';
        listed += '</tr>';
        $("#table-in .table-body").append(listed);
    }
}
function addOutMessage(messages) {
    $("#table-out .table-body").html("");
    var k = messages.length;
    for (i = 0; i < k; i++) {
        mess = messages[i];

        listed = '<tr id="mess' + mess[0] + '">';
        listed += '<td>' + mess[3] + '</td>';
        listed += '<td>' + mess[4] + '</td>';
        listed += '<td>' + mess[1] + '</td>';
        listed += '<td>' + (new Date(Date.parse(mess[5]))).toLocaleString() + '</td>';

        listed += '<td>' + mess[7] + '</td>';

        listed += '<td>';


        if (mess[7] % 2 == 0) {
            if (mess[7] == mess[2]) {
                if (mess[6] == 1) {
                    listed += '<i class="icon-ok-circle icon-white"></i>';
                } else if (mess[6] == 2) {
                    listed += '<i class="icon-ban-circle icon-white"></i>';
                }
                listed += '</td><td>';
                listed += '<button class="btn btn-mini" onclick="replyMessage(' + mess[0] + ',1)">' +
                    '<i class="icon-ok-circle icon-white"></i></button>';
                listed += '</td>';
            } else {
                listed += '<i class="icon-question-sign icon-white"></i>';
                listed += '</td><td>';
                listed += '<div class="btn-group">';
                listed += '<button class="btn btn-mini" onclick="replyMessage(' + mess[0] + ',1)">' +
                    '<i class="icon-ok-circle icon-white"></i></button>';
                listed += '<button class="btn btn-mini" onclick="replyMessage(' + mess[0] + ',2)">' +
                    '<i class="icon-ban-circle icon-white"></i></button>';
                listed += '</div>';

            }
        } else {
            if (mess[7] == mess[2]) {
                if (mess[6] == 1) {
                    listed += '<i class="icon-ok-circle icon-white"></i>';
                } else if (mess[6] == 2) {
                    listed += '<i class="icon-ban-circle icon-white"></i>';
                }
            } else {
                listed += '<i class="icon-question-sign icon-white"></i>';
            }
            listed += '</td><td>&nbsp</td>';
        }
        listed += '</td>';
        listed += '</tr>';
        $("#table-out .table-body").append(listed);
    }
}
function replyMessage(mess_id, resp) {
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
