function castPage() {
    $("#addItemBut").click(function () {
        $("#addItemModal").modal('show');
    });
    $('#printBtn').click(function () {
        popup_print($('<div/>').append($(".sticker").clone()).html());
    });
    $("#addItemB").click(function () {
        $("#addItemModal").modal('hide');
        $.ajax({
            type: "POST",
            url: "/addItem",
            data: JSON.stringify({
                'isbn': isbn,
                'val': $.trim($("#ba-val .active").html())}),
            dataType: "json",
            success: function (data) {
                if (parseInt(data.info) == 1) {
                    loadItems();
                    $("#sticker .biid").html(data.biid);
                    $("#printModal").modal('show');
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
}


function takeItem(itemId, val) {
    $.ajax({
        type: "POST",
        url: "/testBIConv",
        data: JSON.stringify({
            'itemId': itemId}),
        dataType: "json",
        success: function (data) {
            if (parseInt(data.info) == 1) {
                if (val == 1) {
                    $("#takeModal .modal-body").html("Не ценная книга, сразу станет вашей");
                } else if (val == 2) {
                    $("#takeModal .modal-body").html("Ценная книга, нужно послать запрос");
                } else if (val == 3) {
                    $("#takeModal .modal-body").html("Очень ценная книга, нужно послать запрос");
                }
                $("#takeModal").modal('show');
                $('#takeButtonModal').unbind('click');
                $("#takeButtonModal").bind("click", function () {
                    $("#takeModal").modal('hide');
                    $.ajax({
                        type: "POST",
                        url: "/takeReq",
                        data: JSON.stringify({
                            'itemId': itemId}),
                        dataType: "json",
                        success: function (data) {
                            if (parseInt(data.info) == 1) {
                                loadItems();
                            } else if (parseInt(data.info) == 2) {
                                loadItems();
                            } else if (parseInt(data.info) == 4) {
                                notSignIn();
                            }
                        },
                        error: function () {
                            serverError();
                        }
                    });
                });
            } else if (parseInt(data.info) == 3) {
                loadItems()
            }
        },
        error: function () {
            serverError();
        }
    });

}
function returnBook(itemId) {
    $.ajax({
        type: "POST",
        url: "/testBIConv",
        data: JSON.stringify({
            'itemId': itemId}),
        dataType: "json",
        success: function (data) {
            if (parseInt(data.info) == 1) {
                $.ajax({
                    type: "POST",
                    url: "/returnReq",
                    data: JSON.stringify({
                        'itemId': itemId}),
                    dataType: "json",
                    success: function (data) {
                        if (parseInt(data.info) == 1) {
                            loadItems();
                        } else if (parseInt(data.info) == 2) {
                            loadItems();
                        } else if (parseInt(data.info) == 4) {
                            notSignIn();
                        }
                    },
                    error: function () {
                        serverError();
                    }
                });
            } else if (parseInt(data.info) == 3) {
                loadItems()
            }
        },
        error: function () {
            serverError();
        }
    });

}
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

                    listed = '<tr id="bi' + bi.id + '">';
                    listed += '<td>' + bi.id + '</td>';
                    listed += '<td>' + bi.owner.name + '</td>';
                    listed += '<td>' + bi.reader.name + '</td>';
                    listed += '<td>' + bi.value + '</td>';

                    if (bi.reader.id == person_id) {
                        if (bi.take.type == 1) {
                            listed += '<td>' + 'Сообщение' + '</td>';
                        } else if (bi.owner.id == person_id) {
                            listed += '<td>' + 'У вас' + '</td>';
                        } else {
                            if (bi.take.type == 2) {
                                listed += '<td><button class="btn btn-primary btn-mini disabled">Вернуть</button> '
                                    + getTimeLeft(bi.take.info) + '</td>';
                            }
                            else {
                                listed += '<td><button class="btn btn-primary btn-mini" ' +
                                    'onclick="returnBook(' + bi.id + ')">Вернуть</button></td>';
                            }

                        }
                    } else if (bi.take.type == 0) {
                        listed += '<td><button class="btn btn-primary btn-mini" ' +
                            'onclick="takeItem(' + bi.id + ',' + bi.value + ')">Взять</button></td>';
                    } else if (bi.take.type == 2) {
                        listed += '<td>Занята ' + getTimeLeft(bi.take.info) + '</td>';
                    } else if (bi.take.type == 1) {
                        if (bi.take.info == person_id) {
                            listed += '<td>' + 'Запрошено' + '</td>';
                        } else {
                            listed += '<td>' + 'Занята' + '</td>';
                        }
                    }
//                    else if (bi[5] == 3) {
//                        listed += '<td>'+'Есть сообщение'+'</td>';
//                    }
                    listed += '<td><button class="btn btn-primary btn-mini" onclick="printSticker(\'' + bi.id + '\',\'' + bi.owner.name + '\')"><i class="icon-print icon-white"></i></button></td>';
//                    listed += '<td><button class="btn btn-primary btn-mini" onclick="printSticker('+bi.id+')"><i class="icon-print icon-white"></i></button></td>';
                    listed += '</tr>';
                    $("#itemsTalbeDiv #rows").append(listed);
                }
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

function printSticker(biid, owner) {
    $(".sticker .biid").html(biid);
    $(".sticker .username").html(owner);
    $("#printModal").modal('show');
}