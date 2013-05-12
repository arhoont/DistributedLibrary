function castPage() {
    $("#addItemBut").click(function () {
        $("#addItemModal").modal('show');
    });
    $('#printBtn').click(function () {
        $("#sticker").printElement();
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
                } else if (parseInt(data.info) == 2) {

                } else if (parseInt(data.info) == 3) {
                    debug("регистрация");
                }
            },
            error: function () {
                debug("проблемы соединения с сервером");
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
                } else if (parseInt(data.info) == 2) {

                } else if (parseInt(data.info) == 3) {
                    debug("регистрация");
                }
            },
            error: function () {
                debug("проблемы соединения с сервером");
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
                    $("#takeModal .modal-body").html("Не ценная книга ");
                } else if (val == 2) {
                    $("#takeModal .modal-body").html("Ценная книга");
                } else if (val == 3) {
                    $("#takeModal .modal-body").html("Очень ценная книга");
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

                            } else if (parseInt(data.info) == 3) {
                                debug("регистрация");
                            }
                        },
                        error: function () {
                            debug("проблемы соединения с сервером");
                        }
                    });
                });
            } else if (parseInt(data.info) == 3) {
                loadItems()
            }
        },
        error: function () {
            debug("проблемы соединения с сервером");
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

                    listed = '<tr id="bi' + bi[1] + '">';
                    listed += '<td>' + bi[1] + '</td>';
                    listed += '<td>' + bi[2] + '</td>';
                    listed += '<td>' + bi[3] + '</td>';
                    listed += '<td>' + bi[4] + '</td>';
                    if (bi[7] == person_id) {
                        listed += '<td>' + 'У вас' + '</td>';
                    } else if (bi[5] == 0) {
                        listed += '<td><button class="btn btn-primary btn-mini" ' +
                            'onclick="takeItem(' + bi[1] + ',' + bi[4] + ')">Взять</button></td>';
                    } else if (bi[5] == 2) {
                        listed += '<td>Занята ' + parseInt(bi[6] / 60) + ':' + pad(parseInt(bi[6] % 60), 2) + '</td>';
                    } else if (bi[5] == 1) {
                        if (bi[6] == person_id) {
                            listed += '<td>' + 'Запрошено' + '</td>';
                        } else {
                            listed += '<td>' + 'Занята' + '</td>';
                        }
                    }
//                    else if (bi[5] == 3) {
//                        listed += '<td>'+'Есть сообщение'+'</td>';
//                    }
                    listed += '</tr>';
                    $("#itemsTalbeDiv #rows").append(listed);
                }
            } else if (parseInt(data.info) == 2) {

            } else if (parseInt(data.info) == 3) {
                debug("регистрация");
            }
        },
        error: function () {
            debug("проблемы соединения с сервером");
        }
    });
}

function pad(number, length) {

    var str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }

    return str;

}