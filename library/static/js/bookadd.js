function castPage() {
    $('#ba-form-r').submit(function (e) {
        e.preventDefault();
    });
    $('#ba-form-b').submit(function (e) {
        e.preventDefault();
    });
    $("#ba-isbn").focusout(function () {
        if ($("#ba-isbn").val().length > 0) {
            $.ajax({
                type: "POST",
                url: "/checkBook",
                data: JSON.stringify({'type': 1, 'link': "", "isbn": $.trim($("#ba-isbn").val()), "title": ""}),
                dataType: "json",
                success: function (data) {
                    if (parseInt(data.info) == 1) {
                        markBad("#ba-isbn-cg", "");
                        isbnFail(data.books[0][0]);
                    }
                    else {
                        markGood("#ba-isbn-cg", "");
                        $('#ba-isbn').popover('destroy');
                    }
                },
                error: function () {
                    $('#errBook').html('проблемы соединения с сервером');
                }
            });
        }
    });
    $("#authicontrol").append('<div class="author">' +
        '<input type="text" value="" class="aname" placeholder="Имя Фамилия">' +
        '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
        '</div>');
    $("#keywordsf").append('<div class="author">' +
        '<input type="text" value="" class="kword" placeholder="Слово">' +
        '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
        '</div>');

    $('.aname').typeahead({source: authors});
    $('.kword').typeahead({source: keywords});

    $('.infoValuesButton').popover({html: 'true'});
    $("#ba-btn").click(function(){
        addButtonBook();
    });
}

function addEAuthor() {
    $("#authicontrol").append('<div class="author">' +
        '<input type="text" value="" class="aname" placeholder="Имя Фамилия">' +
        '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
        '</div>');
    $('.aname').typeahead({source: authors});

}

function addEKW() {
    $("#keywordsf").append('<div class="author">' +
        '<input type="text" value="" class="kword" placeholder="Слово">' +
        '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
        '</div>');
    $('.kword').typeahead({source: keywords});
}

function addButtonBook() {
    newKWList = [];
    $(".kword").each(function (key, value) {
        if ($(this).val().length > 0) {
            newKWList.push($.trim($(this).val()));
        }
    });

    newAuthList = [];
    $(".aname").each(function (key, value) {
        if ($(this).val().length > 0) {
            newAuthList.push($.trim($(this).val()));
        }
    });

    if (newAuthList.length == 0) {
        debug("Выберите авторов");
    } else if ($("#ba-isbn-cg").hasClass("error")) {
        debug("Такая книга уже есть");
    } else {
        $.ajax({
            type: "POST",
            url: "/addbajax",
            data: JSON.stringify({'link': $.trim($('#ba-link').val()),
                'isbn': $.trim($('#ba-isbn').val()),
                'title': $.trim($('#ba-title').val()),
                'authors': newAuthList,
                'lang': $.trim($('#ba-lang').val()),
                'keywords': newKWList,
                'desc': $.trim($('#ba-desc').val()),
                'val': $.trim($("#ba-val .active").html())}),
            dataType: "json",
            success: function (data) {
                if (parseInt(data.info) == 1) {
                    debug("добавлено");
                } else if (parseInt(data.info) == 2) {
                    debug("Такая книга уже есть");
                } else if (parseInt(data.info) == 3) {
                    debug("что-то не работает");
                }
            },
            error: function () {
                debug("проблемы соединения с сервером");
            }
        });
    }
}

function debug(text) {
    $(".alertSpan").html('    <div class="alert" id="bookAlert">' +
        '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
        '<span class="alertText">' + text + '</span>' +
        '</div>');
}

function isbnFail(isbn) {
    $('#ba-isbn').popover({
        html: true,
        title: '<strong>Ошибка</strong>',
        content: '<div>Такая книга уже есть, добавьте экземпляр на странице информации <a class="btn btn-info" href="/book/add?isbn=' + isbn + '">Перейти к книге</a></div>',
        trigger: 'manual'

    });
    $('#ba-isbn').popover('show');
}
