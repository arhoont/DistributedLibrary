function castPage() {
    $("#addItemBut").click(function () {
        $("#addItemModal").modal('show');
    });
    $('#printBtn').click(function () {
        var node = $("#printModal .printable-div").clone();
        node.find('.close').remove();
        popup_print($('<div/>').append(node).html());
    });
    $("#addItemB").click(function () {
        $("#addItemModal").modal('hide');
        $.ajax({
            type: "POST",
            url: "/addItem",
            data: JSON.stringify({
                'isbn': isbn,
                'val': 1}),
            dataType: "json",
            success: function (data) {
                if (parseInt(data.info) == 1) {
                    loadItems();
                    printSticker(data.biid, data.owner);

                } else if (parseInt(data.info) == 4) {
                    notSignIn()
                }
            },
            error: function () {
                serverError();
            }
        });
    });
    $('.infoValuesButton').popover({html: 'true'});
    $("#addOpinionB").click(function () {
        $("#opinionModal").modal('show');
    });

    $("#addOpinion").click(function () {
        $("#opinionModal").modal('hide');
        $.ajax({
            type: "POST",
            url: "/addOpinion",
            data: JSON.stringify({
                'isbn': isbn,
                'rating': $.trim($("#ba-rating .active").html()),
                'opiniontext': $.trim($("#opinionTextArea").val())}),
            dataType: "json",
            success: function (data) {
                if (parseInt(data.info) == 1) {
                    location.reload();
                } else if (parseInt(data.info) == 4) {
                    notSignIn();
                }
            },
            error: function () {
                serverError();
            }
        });
    });
    loadItems();
    $('#messageModal').on('hidden', function () {
        loadItems();
    });
    $('#takeModal').on('hidden', function () {
        loadItems();
    });

    document.onkeydown = function (evt) {
        evt = evt || window.event;
        if (evt.keyCode == 27) {
            $(".Person").popover("hide");
        }
    };

}

$(document).click(function (e) {
    if (e.target.className != "Person") {
        $(".Person").popover("hide");
    }
});


function loadItems() {
    $.ajax({
        type: "POST",
        url: "/loadItems",
        data: JSON.stringify({
            'isbn': isbn}),
        dataType: "json",
        success: function (data) {
            if (parseInt(data.info) == 1) {
                $("#itemsTalbeDiv #rows").html("");
                var k = data.bilist.length;
                for (i = 0; i < k; i++) {
                    bi = data.bilist[i];

                    listed = '<tr id="bi_item_' + bi.id + '">';
                    listed += '<td>' + bi.id + '</td>';

                    var owner = new Person(bi.owner.id, bi.owner.name, bi.owner.email, bi.owner.phone_ext, bi.owner.mobile);
                    var reader = new Person(bi.reader.id, bi.reader.name, bi.reader.email, bi.reader.phone_ext, bi.reader.mobile);

                    listed += '<td>' + owner.getHTML() + '</td>';
                    listed += '<td>' + reader.getHTML() + '</td>';
                    listed += '<td></td>';

                    listed += '<td class="item_status">';
                    if (reader.id != person_id) {

                        listed += '<div class="input-append btn-group">';
                        listed += '<button class="btn btn-primary btn-mini" onclick="takeBI(\'' + bi.id + '\')">Взял</button>';
                        listed += '<button class="btn btn-primary btn-mini" onclick="askBookItem(\'' + bi.id + '\')">Спросить</button>';
                        listed += '/div';
                    } else {
                        listed += '<span class="label">У вас</span>';
                    }
                    listed += '</td>';

                    listed += '<td>';
                    listed += '<button class="btn btn btn-mini" onclick="printSticker(\'' + bi.id + '\',\'' + bi.owner.name + '\')">' +
                        '<i class="icon-print icon-white"></i></button>';
                    listed += '</td>';

                    listed += '</tr>';
                    $("#itemsTalbeDiv #rows").append(listed);
                }
                $('.Person').popover({
                    html: true,
                    trigger: 'manual'
                }).click(function (e) {
                        $(this).popover('show');
                    });
            }
        },
        error: function () {
            serverError();
        }
    });

}

function takeBI(bi_id) {
    var conf = confirm("Уверены?");
    if (conf != true) {
        return;
    }
    $("#bi_item_" + bi_id + " .item_status").html('<i class="icon-spinner icon-white"></i>');
    $.ajax({
        type: "POST",
        url: "/takeBI",
        data: JSON.stringify({
            'info': 1,
            'bi_id': bi_id}),
        dataType: "json",
        success: function (data) {
            if (parseInt(data.info) == 1) {
                $("#bi_item_" + bi_id + " .item_status").html('<span class="label">У вас</span>');
            } else if (parseInt(data.info) == 4) {
                notSignIn();
            }
        },
        error: function () {
            serverError();
        }
    });
}

function getTimeLeft(t) {
    return parseInt(t / 60) + ':' + pad(parseInt(t % 60), 2);
}

function pad(number, length) {

    var str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }

    return str;

}

function printSticker(bi_id, owner) {
    var sticker = new Sticker(lib_name, book_title, bi_id, owner);
    $(".printable-div").html(sticker.getHTML());
    updateSliders();
    $("#printModal").modal('show');
}

function removeOpinion(opinion_id) {
    var conf = confirm("Вы уверены, что хотитет удалить отзыв?");

    if (conf == true) {
        $.ajax({
            type: "POST",
            url: "/removeOpinion",
            data: JSON.stringify({
                'info': 1,
                'opinion_id': opinion_id}),
            dataType: "json",
            success: function (data) {
                if (parseInt(data.info) == 1) {
                    $("#opinion_" + opinion_id).remove();
                }
            },
            error: function () {
                serverError();
            }
        });
    }
}

function askBookItem(bi_id) {
    $.ajax({
        type: "POST",
        url: "/askBookItem",
        data: JSON.stringify({
            'info': 1,
            'bi_id': bi_id}),
        dataType: "json",
        success: function (data) {
            if (parseInt(data.info) == 1) {
                window.location.href = 'mailto:'+data.text;
//                window.location.href = 'mailto:address@domain.com?Subject=message %D1%84%D1%8B%D0%B2%D1%84%D1%8B%D0%B2 here&body=%0A%0A%0AMessage body here ';
            }
        },
        error: function () {
            serverError();
        }
    });
}