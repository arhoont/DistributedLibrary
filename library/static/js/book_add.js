isbn_status=false;
function castPage() {
    $('#printBtn').click(function () {
        popup_print($('<div/>').append($(".sticker").clone()).html());
    });

    $("#ba-isbn").focusout(function () {
        isbn_status=false;
        $('#ba-isbn').popover('destroy');
        if ($("#ba-isbn").val().length > 0) {
            in_isbn = $.trim($("#ba-isbn").val());
            var isbn = ISBN.parse(in_isbn);
            if (isbn == null) {
                isbnFailFormat();
            } else {

                if (isbn.isIsbn10()) {
                    isbn = isbn.asIsbn10(true);
                } else if (isbn.isIsbn13()) {
                    isbn = isbn.asIsbn13(true);
                }
                $("#ba-isbn").val(isbn);
                $.ajax({
                    type: "POST",
                    url: "/checkBook",
                    data: JSON.stringify({'type': 1, "isbn": isbn}),
                    dataType: "json",
                    success: function (data) {
                        if (parseInt(data.info) == 1) {
                             isbnFail(data.book);
                        }
                        else {
                            isbn_status=true;
                            $('#ba-isbn').popover('destroy');
                        }
                    },
                    error: function () {
                        serverError();
                    }
                });
            }
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
            addImage(data.path);
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
        $("#link-load-b").html('<i class="icon-spinner icon-white"></i>');
        $.ajax({
            type: "POST",
            url: "/loadFromOzon",
            data: JSON.stringify({'type': 'link', "link": $.trim($("#ba-link").val())}),
            dataType: "json",
            success: function (data) {
                if (parseInt(data.info) == 1) {
                    fillFields(data.book);
                }
                $("#link-load-b").html('<i class="icon-download icon-white"></i>');
                $("#ba-isbn").focusout();
            },
            error: function () {
                $("#link-load-b").html('<i class="icon-download icon-white"></i>');
                serverError();
            }
        });
    });
    $("#link-img-load").click(function () {
        img_link = prompt("Введите ссылку на картинку");
        if (img_link == null || img_link.length == 0) {
            return;
        }
        $.ajax({
            type: "POST",
            url: "/loadImgByLink",
            data: JSON.stringify({"link": img_link}),
            dataType: "json",
            success: function (data) {
                if (parseInt(data.info) == 1) {
                    addImage(data.path);
                } else {
                    alert("Что-то тут не так...");
                }
                $("#link-load-b").html('<i class="icon-download icon-white"></i>');
            },
            error: function () {
                $("#link-load-b").html('<i class="icon-download icon-white"></i>');
                serverError();
            }
        });
    });
}

function addImage(path) {
    $("#prev_file").val(path);
    $("#b-img-a").html('<img id="b-img" src="' + media_path + path + '" alt="Uploading...." />');

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
    addImage(book.img);
}
function addEAuthor(text) {
    text = text || "";
    $("#authicontrol").append('<div class="author">' +
        '<input type="text" value="' + text + '" class="aname" placeholder="Имя Фамилия">' +
        '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
        '</div>');
    $('.aname').typeahead({source: authors});
}

function addEKW(text) {
    text = text || "";
    $("#keywordsf").append('<div class="author">' +
        '<input type="text" value="' + text + '" class="kword" placeholder="Слово">' +
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
        displayAlert("У книги должен быть автор", "alert-danger")
    } else if (isbn_status==false) {
        isbnFailFormat();
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
                    $(".sticker .biid").html(data.biid);
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
function isbnFailFormat() {
    $('#ba-isbn').popover({
        html: true,
        title: '<strong>Ошибка</strong>',
        content: '<div>Некорректный ISBN </div>',
        trigger: 'manual'

    });
    $('#ba-isbn').popover('show');
}
