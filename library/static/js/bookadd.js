function castPage() {
//    $("#ba-val").buttonset();
//    setDialogKeywords();
//    setDialogAuthors();
    $('#ba-form-r').submit(function (e) {
        e.preventDefault();
        addButtonBook();
    });
    $('#ba-form-b').submit(function (e) {
        e.preventDefault();
        $('#rform-submit').click();
    });
    $('.infoValues').click(function () {
        $('#valuesInfoModal').modal('show');
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
    $("#ba-title").focusout(function () {
        if ($("#ba-title").val().length > 0) {
            $.ajax({
                type: "POST",
                url: "/checkBook",
                data: JSON.stringify({'type': 2, 'link': "", "isbn": "", "title": $.trim($("#ba-title").val())}),
                dataType: "json",
                success: function (data) {
                    if (parseInt(data.info) == 1) {
                        markBad("#ba-title-cg", "");
                        titleFail(data.books);
                    }
                    else {
                        markGood("#ba-title-cg", "");
                    }
                },
                error: function () {
                    $('#errBook').html('проблемы соединения с сервером');
                }
            });
        }
    });
    $("#authicontrol").append('<div class="author">' +
        '<input type="text" value="" class="aname" placeholder="Фамилия Имя">' +
        '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
        '</div>');
    $("#keywordsf").append('<div class="author">' +
        '<input type="text" value="" class="kword" placeholder="Слово">' +
        '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
        '</div>');

    $('.aname').typeahead({source: authors});
    $('.kword').typeahead({source: keywords});
}

function addEAuthor() {
    $("#authicontrol").append('<div class="author">' +
        '<input type="text" value="" class="aname" placeholder="Фамилия Имя">' +
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
        bookError("Выберите авторов");
    } else if ($("#ba-isbn-cg").hasClass("error")) {
        bookError("Такая книга уже есть");
    } else if ($("#ba-title-cg").hasClass("error")) {
        bookError("Похожая книгу есть");

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
                    bookError("добавлено");
                } else if (parseInt(data.info) == 2) {
                    bookError("Такая книга уже есть");
                } else if (parseInt(data.info) == 3) {
                    bookError("что-то не работает");
                }
            },
            error: function () {
                bookError("проблемы соединения с сервером");
            }
        });
    }
}

function bookError(text) {
    $(".alertSpan").html('    <div class="alert" id="bookAlert">' +
        '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
        '<span class="alertText">' + text + '</span>' +
        '</div>');
}

function isbnFail(isbn) {
    $('#ba-isbn').popover({
        html: true,
        title: '<strong>Ошибка</strong>',
        content: '<div>Такая книга уже есть <a class="btn btn-info" href="/book?isbn=' + isbn + '">Посмотреть</a></div>',
        trigger: 'manual'

    });
    $('#ba-isbn').popover('show');
}
function titleFail(books) {
    $('#ba-title').popover({
        template: '<div class="popover special-class popover-wrapper"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div></div>',
        html: true,
        title: '<strong>Похожие книги</strong>' +
            '<button type="button" id="closeTitleFail" class="close">&times;</button>',
        content: '<span id="spanTFTable"><table class="table table-striped table-condensed sim-books-table"><tbody id="simBooks"></tbody><table></span>' +
            '<button class="btn btn-info" id="closeTFB">Закрыть</button>',
        trigger: 'manual'

    });
    $('#ba-title').popover('show');
    $('#closeTitleFail').click(function () {
        $('#ba-title').popover('destroy');
        markGood("#ba-title-cg", "");
    });
    $('#closeTFB').click(function () {
        $('#ba-title').popover('destroy');
        markGood("#ba-title-cg", "");
    });
    for (book in books){
        $("#simBooks").append("<tr><td class='isbnColum'><a href='/book/info?isbn="+books[book][0]+"'>"+books[book][0]+"</a></td> " +
            "<td class='titleColum'><a href='/book/info?isbn="+books[book][0]+"'>"+books[book][2]+"</a></td><td class='authColum'>"+books[book][4]+"</td></tr>");
    }
}