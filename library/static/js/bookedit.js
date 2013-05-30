function castPage() {

    $('#printBtn').click(function () {
        $("#sticker").printElement();
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
                    window.location = "/book/info/?isbn="+$('#ba-isbn').val();
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
