function castPage() {
    $('#printBtn').click(function () {
        popup_print($('<div/>').append($(".sticker").clone()).html());
    });

    $("#ba-isbn").focusout(function () {
        if ($("#ba-isbn").val().length > 0) {
            $.ajax({
                type: "POST",
                url: "/checkBook",
                data: JSON.stringify({'type': 1, "isbn": $.trim($("#ba-isbn").val())}),
                dataType: "json",
                success: function (data) {
                    if (parseInt(data.info) == 1) {
                        markBad("#ba-isbn-cg", "");
                        isbnFail(data.book);
                    }
                    else {
                        markGood("#ba-isbn-cg", "");
                        $('#ba-isbn').popover('destroy');
                    }
                },
                error: function () {
                    serverError();
                }
            });
        }
    });

    $('.aname').typeahead({source: authors});
    $('.kword').typeahead({source: keywords});

    $('.infoValuesButton').popover({html: 'true'});
    $("#ba-btn").click(function () {
        addButtonBook();
    });

    $("#imageform").ajaxForm(function (data) {
        data = JSON.parse(data);
        if (data.info == 1) {
            $("#prev_file").val(data.path);
            $("#b-img-a").html('<img id="b-img" src="' + media_path + data.path + '" alt="Uploading...." />');
        } else {
            alert("неправильный формат файла")
        }
    });
    $('#b-img-a').click(function () {
        $("#image-input").click();
    });
    $('#image-input').live('change', function () {
        $("#imageform").submit();
    });

    $('#printModal').on('hidden', function () {
        window.location = "/book/info/?isbn=" + $('#ba-isbn').val();
    });
    addEAuthor();
    addEKW();
    $("#ba-lang").click(function () {
        if ($('#ba-lang').val() == "add-language") {
            val = prompt("Введите язык");
            if (val && val.length > 0) {
                $("#ba-lang").append('<option value="' + val + '" selected>' + val + '</option>');
            } else {
                $("#ba-lang :first").prop('selected', true);
            }
        }
    });
    $("#isbn-load-b").click(function () {
        if ($.trim($("#ba-isbn").val()) == 0) {
            return;
        }
        $.ajax({
            type: "POST",
            url: "/loadFromOzon",
            data: JSON.stringify({'type': 'isbn', "isbn": $.trim($("#ba-isbn").val())}),
            dataType: "json",
            success: function (data) {
                if (parseInt(data.info) == 1) {
                    console.log(data);
                }
            },
            error: function () {
                serverError();
            }
        });
    });
    $("#link-load-b").click(function () {
        if ($.trim($("#ba-link").val()) == 0) {
            return;
        }
        $.ajax({
            type: "POST",
            url: "/loadFromOzon",
            data: JSON.stringify({'type': 'link', "link": $.trim($("#ba-link").val())}),
            dataType: "json",
            success: function (data) {
                if (parseInt(data.info) == 1) {
                    fillFields(data.book);
                }
            },
            error: function () {
                serverError();
            }
        });
    });
}

function fillFields(book) {
    $("#ba-link").val(book.link);
    $("#ba-isbn").val(book.isbn);
    $("#ba-title").val(book.title);
    $("#ba-desc").val(book.description);
    option = $("#ba-lang option[value='" + book.language + "']");
    if (option.val()) {
        option.attr('selected', 'selected')
    } else {
        $("#ba-lang").append('<option value="' + book.language + '" selected>' + book.language + '</option>');
    }
    $("#authicontrol").html("");
    for (auth in book.authors) {
        addEAuthor(book.authors[auth]);
    }
    $("#keywordsf").html("");
    for (key in book.kwords) {
        addEKW(book.kwords[key]);
    }
}
function addEAuthor(text) {
    text = text || "";
    $("#authicontrol").append('<div class="author">' +
        '<input type="text" value="'+text+'" class="aname" placeholder="Имя Фамилия">' +
        '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
        '</div>');
    $('.aname').typeahead({source: authors});
}

function addEKW(text) {
    text = text || "";
    $("#keywordsf").append('<div class="author">' +
        '<input type="text" value="'+text+'" class="kword" placeholder="Слово">' +
        '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
        '</div>');
    $('.kword').typeahead({minLength: 0, source: keywords, items: 9999});
    $(".kword").focus(function () {
        $(this).trigger("keyup");
    });
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
                'desc': $('#ba-desc').val(),
                'val': $.trim($("#ba-val .active").html()),
                'image': $("#prev_file").val()}),
            dataType: "json",
            success: function (data) {
                if (parseInt(data.info) == 1) {
                    $("#sticker .biid").html(data.biid);
                    $("#printModal").modal('show');
                } else if (parseInt(data.info) == 2) {
                    displayAlert("Такая книга уже есть", "alert-danger")
                } else if (parseInt(data.info) == 4) {
                    notSignIn();
                }
            },
            error: function () {
                serverError();
            }
        });
    }
}


function isbnFail(isbn) {
    $('#ba-isbn').popover({
        html: true,
        title: '<strong>Ошибка</strong>',
        content: '<div>Такая книга уже есть, добавьте экземпляр на странице информации <a class="btn btn-info" href="/book/info?isbn=' + isbn + '">Перейти к книге</a></div>',
        trigger: 'manual'

    });
    $('#ba-isbn').popover('show');
}
