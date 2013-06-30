function castPage() {

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
            url: "/editbajax",
            data: JSON.stringify({'link': $.trim($('#ba-link').val()),
                'isbn': $.trim($('#ba-isbn').val()),
                'title': $.trim($('#ba-title').val()),
                'authors': newAuthList,
                'lang': $.trim($('#ba-lang').val()),
                'keywords': newKWList,
                'desc': $.trim($('#ba-desc').val()),
                'image': $("#prev_file").val()}),
            dataType: "json",
            success: function (data) {
                if (parseInt(data.info) == 1) {
                    window.location = "/book/info/?isbn=" + $('#ba-isbn').val();
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
