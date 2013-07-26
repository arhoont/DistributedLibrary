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
        } else if ($(this).attr("id") == "ret") {
            getRetMessages();
        }
    });
    $('#messageButton').popover({
        html: true,
        placement: 'bottom',
        content: '<div>Новые запросы</div>',
        trigger: 'manual'

    });
    messCountTest();
    $('#messageModal').on('hidden', function () {
        $('#messageButton').popover('hide');
        messCountTest();
    });
    $('.back-btn').click(function () {
        window.history.back();
    });
    castPage();

    $("#load_book_list").click(function () {
    $.ajax({
        type: "POST",
        url: "/loadTextFormatBooks",
        dataType: "json",
        success: function (data) {
           $("#text_format_books").html(data.book);
	   $("#booksFormText").modal('show');
         },
        error: function () {
            serverError();
        }
    });

    });

});

function messCountTest() {
    $.ajax({
        type: "POST",
        url: "/countInMessage",
        dataType: "json",
        success: function (data) {
            if (data.count > 0) {
                $('#messageButton').popover('show');
            }
        },
        error: function () {
//            serverError();
        }
    });
}

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

function displayAlert(text, alert_class) {
    $(".alert-place").html('<div id="main-alert" class="alert"></div>');
    $("#main-alert").addClass(alert_class);
    $("#main-alert").html('<button type="button" class="close" data-dismiss="alert">&times;</button>' + text);
}

function notSignIn() {
    displayAlert("Войдите в систему", "alert-danger")
}

function serverError() {
    displayAlert("Проблемы соединения с сервером", "alert-danger")
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
function removeMark(cg) {
    $(cg).removeClass("success");
    $(cg).removeClass("error");
    $(cg + " .help-inline").html('');
}
function getRetMessages() {
    $.ajax({
        type: "POST",
        url: "/getRetMessages",
        data: JSON.stringify({
            'info': 1}),
        dataType: "json",
        success: function (data) {
            $("#table-msg .table-body").html("");
            var k = data.messages.length;
            for (i = 0; i < k; i++) {
                $("#table-msg .table-body").prepend(fomatRetMessage(data.messages[i]));
            }
        },
        error: function () {
            serverError();
        }
    });
}

function fomatRetMessage(mess) {

    yes_b = '<button class="btn btn-mini" onclick="replyRetMessage(' + mess.id + ')">' +
        '<i class="icon-ok icon-white icon-large"></i></button>';

    listed = '<tr id="mess' + mess.id + '">';
    listed += '<td>' + mess.book + '</td>';
    listed += '<td>' + mess.person + '</td>';
    listed += '<td>' + mess.item_id + '</td>';
    listed += '<td>' + (new Date(Date.parse(mess.date))).toLocaleString() + '</td>';

    listed += '<td> Возврат </td>';

    listed += '<td class="c-icon-td">';
    listed += yes_b;
    listed += '</td></tr>';
    return listed;
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
            } else if (parseInt(data.info) == 4) {
                notSignIn();
            }
        },
        error: function () {
            serverError();
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
    yes_b = '<button class="btn btn-mini" onclick="replyMessage(' + mess.id + ',1,0)">' +
        '<i class="icon-ok icon-white icon-large"></i></button>';
    no_b = '<button class="btn btn-mini" onclick="replyMessage(' + mess.id + ',2,0)">' +
        '<i class="icon-ban icon-white icon-large"></i></button>';
    ch_b = '<button class="btn btn-mini" onclick="replyMessage(' + mess.id + ',1,1)">' +
        '<i class="icon-ok-circle icon-white icon-large"></i></button>' +
        '<button class="btn btn-mini" onclick="replyMessage(' + mess.id + ',2,1)">' +
        '<i class="icon-ban-circle icon-white icon-large"></i></button>';


    listed = '<tr id="mess' + mess.id + '">';
    listed += '<td>' + mess.book + '</td>';
    listed += '<td>' + mess.person + '</td>';
    listed += '<td>' + mess.item_id + '</td>';
    listed += '<td>' + (new Date(Date.parse(mess.date))).toLocaleString() + '</td>';

    listed += '<td>Запрос</td>';

    listed += '<td class="c-icon-td">';
    if (mtio == "in") {
        if (mess.resp == 2) {
            listed += no_i;
        } else if (mess.mtype < mess.bi_val) {
            listed += que_i;
        } else {
            listed += yes_i;
        }
        if ((mess.mtype == mess.bi_val) || (mess.resp == 2)) {
            listed += '</td><td  class="r-btn-td">' + yes_b + '</td>';
        } else {
            listed += '</td><td  class="r-btn-td">' + ch_b + '</td>';
        }
    } else if (mtio == "out") {
        if (mess.resp == 2) {
            listed += no_i;
        } else if (mess.mtype < mess.bi_val) {
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
                notSignIn();
            }
        },
        error: function () {
            serverError();
        }
    });
}
function replyRetMessage(mess_id) {
    $.ajax({
        type: "POST",
        url: "/replyRetMessage",
        data: JSON.stringify({'mess_id': mess_id}),
        dataType: "json",
        success: function (data) {
            if (parseInt(data.info) == 1) {
                $("#mess" + mess_id).remove();
            } else if (parseInt(data.info) == 3) {
                notSignIn();
            }
        },
        error: function () {
            serverError();
        }
    });
}

function popup_print(data) {
    var w = window.open();
    w.document.write('<html><head>');
//    w.document.write('<link rel="stylesheet" href="' + static_path + 'css/base.css" type="text/css" />');
    w.document.write('</head><body >');
    w.document.write(data);
    w.document.write('</body></html>');
    w.print();
    w.close();
    return true;
}



function getUrlParams() {


    var url=document.URL.split('?')[1];
    if (!url){
        return null;
    }
    var url_params = {};
    params = url.split('&');
    for (var param in params) {
        url_params[params[param].split('=')[0]]=params[param].split('=')[1];
    }
    return url_params;
}
