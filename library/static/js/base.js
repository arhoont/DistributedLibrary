var text_area_f_s = '\t'
var text_area_s_s = '\n'

text_area_bis = [];

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
        readMessage();
    });
    $('#messageButton').popover({
        html: true,
        placement: 'bottom',
        content: '<div>Новые сообщения</div>',
        trigger: 'manual'

    });
    $('#messageModal').on('hidden', function () {
        $('#messageButton').popover('hide');
        messCountTest();
    });
    messCountTest();

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
                printStickers(data.books);
            },
            error: function () {
                serverError();
            }
        });

    });

    $("#printStickers").click(function () {
        var node=$("#booksFormText .printable-div").clone();
        node.find('.close').remove();
        popup_print($('<div/>').append(node).html());

    });

    $(".slider").change(function () {
        $(".sticker").css(this.name, this.value + "px");
    });
    $(".slider-page").change(function () {
        $(".printable-div").css(this.name, this.value + "px");
    });

    $("#b-group-f-s button").click(function () {
        text_area_f_s = separatorConverter(this.value);
        $("#b-group-f-s input").val("");
        setTextAreaBooks();
    });

    $("#b-group-f-s input").keyup(function () {
        text_area_f_s = this.value;
        $("#b-group-f-s button").removeClass("active");
        setTextAreaBooks();
    });

    $("#b-group-s-s button").click(function () {
        text_area_s_s = separatorConverter(this.value);
        $("#b-group-s-s input").val("");

        setTextAreaBooks();
    });

    $("#b-group-s-s input").keyup(function () {
        text_area_s_s = this.value;
        $("#b-group-s-s button").removeClass("active");
        setTextAreaBooks();
    });
});

function separatorConverter(val) {
    var sep = " ";
    switch (val) {
        case "1":
            sep = "\t";
            break;
        case "2":
            sep = "\n";
            break;
        case "3":
            sep = ",";
            break;
        case "4":
            sep = ".";
            break;
        case "5":
            sep = " ";
            break;

    }
    return sep;
}

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
            serverError();
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
        $("#table-msg .table-body").prepend(formatMessage(messages[i], "in"));
    }
}


function formatMessage(mess) {

    listed = '<tr id="message_' + mess.id + '">';

    listed += '<td>' + mess.book;
    if (mess.isRead==0){
        listed += ' <span class="label label-info">new</span>';
    }
    listed += '</td>';

    listed += '<td>' + mess.personFrom + '</td>';
    listed += '<td>' + mess.item_id + '</td>';
    listed += '<td>' + (new Date(Date.parse(mess.date))).toLocaleString() + '</td>';
    listed += '</td></tr>';
    return listed;
}

function readMessage(){
    $.ajax({
        type: "POST",
        url: "/readMessage",
        data: JSON.stringify({
            'info': 1}),
        dataType: "json",
        success: function (data) {
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
    var url = document.URL.split('?')[1];
    if (!url) {
        return null;
    }
    var url_params = {};
    params = url.split('&');
    for (var param in params) {
        url_params[params[param].split('=')[0]] = params[param].split('=')[1];
    }
    return url_params;
}


function Sticker(lib_name, book_title, bi_id, person) {
    Sticker.width = 200;
    Sticker.height = 100;
    Sticker.margin_right = 0;
    Sticker.margin_bottom = 0;

    this.lib_name = lib_name;
    this.book_title = book_title;
    this.bi_id = bi_id;
    this.person = person;

    this.getHTML = function () {
        html_sticker = '<div class="sticker" style="font-family:sans-serif;display: inline-block;border:2px ' +
            'solid #aaaaaa;border-radius: 4px;padding: 5px;">';
        html_sticker +='<button type="button" class="close" data-dismiss="alert">&times;</button>';
        html_sticker += '<div class="libname" style="font-weight: bold;text-align:' +
            ' center; font-style: italic;">' + this.lib_name + '</div>';
        html_sticker += '<div style="font-size: 12px; white-space: nowrap; overflow:hidden; text-overflow: ellipsis;">' + this.book_title + '</div>';
        html_sticker += '<div><span>id:&nbsp;&nbsp;</span><span class="biid" style="font-weight: bold; font-size: 19px">' + this.bi_id + '</span></div>';
        html_sticker += '<div class="username">' + this.person + '</div>';
        html_sticker += '</div>';
        return html_sticker;
    }
}

function Person(id, name, email, phone_ext, mobile) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.mobile = mobile;
    this.phone_ext = phone_ext;
    this.getHTML = function () {
        html_person = '<a class="Person" data-toggle="popover" data-placement="right"' +
            'data-trigger="hover" data-content="' +
            '<table ' +
            '<tr>' +
            '<td  style=\'border-top: none;\'>email:</td>' +
            '<td  style=\'border-top: none;\'><a href=\'mailto:' + this.email + '\'>' + this.email + '</a></td>' +
            '</tr>' +
            '<tr>' +
            '<td  style=\'border-top: none;\'>ext:</td>' +
            '<td  style=\'border-top: none;\'>' + this.phone_ext + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td  style=\'border-top: none;\'>mobile:</td>' +
            '<td  style=\'border-top: none;\'>' + this.mobile + '</td>' +
            '</tr>' +
            '</table>' +
            '">' + this.name + '</a>';
        return html_person;
    }
}

function printStickers(books) {
    text_area_bis = books;
    setTextAreaBooks();
    $(".printable-div").html('');
    for (var i in books) {
        var sticker = new Sticker(books[i].libname, books[i].book_title,
            books[i].biid, books[i].owner);
        $("#booksFormText .printable-div").append(sticker.getHTML());
    }
    updateSliders();
    $("#booksFormText").modal('show');
}

function setTextAreaBooks() {

    f_s = text_area_f_s;
    s_s = text_area_s_s;
    text_area = 'library' + f_s + 'id' + f_s + 'book' + f_s + 'owner' + s_s;
    for (var i in text_area_bis) {
        text_area += text_area_bis[i].libname + f_s + text_area_bis[i].book_title + f_s +
            text_area_bis[i].biid + f_s + text_area_bis[i].owner + s_s;
    }
    $("#text_format_books").html(text_area);
}

function updateSliders() {
    $('.slider[name="height"]').attr('value', Sticker.height);
    $('.slider[name="width"]').attr('value', Sticker.width);
    $('.slider[name="margin-right"]').attr('value', Sticker.margin_right);
    $('.slider[name="margin-bottom"]').attr('value', Sticker.margin_bottom);

    $('.slider-page[name="margin-top"]').attr('value', '0');
    $('.slider-page[name="margin-left"]').attr('value', '0');

    $(".slider").change();
    $(".slider-page").change();

    text_area_f_s = '\t'
    text_area_s_s = '\n'

    setTextAreaBooks();
}

