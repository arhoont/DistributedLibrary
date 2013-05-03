function castPage() {
    $("#addItemBut").click(function () {
        $("#addItemModal").modal('show');
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
                    location.reload();
                } else if (parseInt(data.info) == 2) {

                } else if (parseInt(data.info) == 3) {
                    debug("регистрация");
                }
            },
            error: function () {
                bookError("проблемы соединения с сервером");
            }
        });
    });
    $('.infoValuesButton').popover({html: 'true'});
    $('.closeInfoPop').live('click', function () {
        $('.infoValuesButton').click();
    });
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
                bookError("проблемы соединения с сервером");
            }
        });
    });
    loadItems();
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
                    $("#takeModal .modal-body").html("Кинга имеет ценность <strong>\"1\"</strong>, после нажатия кнопки \"Взять\", " +
                        "вы сразу станете читателем.<br> <span class='text-warning'>Убедитесь, что вы можете физически получить эту книгу в ближайшее время.</span>");
                } else if (val == 2) {
                    $("#takeModal .modal-body").html("Кинга имеет ценность <strong>\"2\"</strong>, вам нужно будет дождать, " +
                        "пока текущий читатель согласится отдать вам этот экземпляр. После подтверждения экземпляр станет вашим");
                } else if (val == 3) {
                    $("#takeModal .modal-body").html("Кинга имеет ценность <strong>\"3\"</strong>, вам нужно будет дождать, " +
                        "пока текущий читатель согласится отдать вам этот экземпляр. После " +
                        "этого нужно будет подтвердить получение книги");
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
                                debug("отправлено")
                            } else if (parseInt(data.info) == 2) {

                            } else if (parseInt(data.info) == 3) {
                                debug("регистрация");
                            }
                        },
                        error: function () {
                            bookError("проблемы соединения с сервером");
                        }
                    });
                });
            } else if (parseInt(data.info) == 2) {

            } else if (parseInt(data.info) == 3) {
                $(".alertSpan").html('<div class="alert" id="bookAlert">' +
                    '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
                    '<span class="alertText">Кто-то уже хочет взять этот экземпляр</span>' +
                    '</div>');
            }
        },
        error: function () {
            bookError("проблемы соединения с сервером");
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

                    listed += '<td><button class="btn btn-primary btn-mini" ' +
                        'onclick="takeItem('+bi[1]+','+bi[4]+')">Взять</button></td>';
                    listed += '</tr>';
                    $("#itemsTalbeDiv #rows").append(listed);
                }
            } else if (parseInt(data.info) == 2) {

            } else if (parseInt(data.info) == 3) {
                debug("регистрация");
            }
        },
        error: function () {
            bookError("проблемы соединения с сервером");
        }
    });
}

