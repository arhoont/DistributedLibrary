function castPage() {
    $("#radioset").buttonset();
    setDialogKeywords();
    setDialogAuthors();
    $('#bookForm').submit(function (e) {
        e.preventDefault();
        addButtonF();
    });
    $("#baisbn").focusout(function () {
        if ($("#baisbn").val().length > 0) {
            $.ajax({
                type: "POST",
                url: "/checkBook",
                data: JSON.stringify({'type': 1, 'link': "", "isbn": $("#baisbn").val(), "title": ""}),
                dataType: "json",
                success: function (data) {
                    if (parseInt(data.info) == 1) {
                        markBad("#isbnspan","#baisbn")
                    }
                    else {
                        markGood("#isbnspan","#baisbn")
                    }
                },
                error: function () {
                    $('#errBook').html('проблемы соединения с сервером');
                }
            });
        }
    });
    $("#batitle").focusout(function () {
        if ($("#batitle").val().length > 0) {
            $.ajax({
                type: "POST",
                url: "/checkBook",
                data: JSON.stringify({'type': 2, 'link': "", "isbn": "", "title": $("#batitle").val()}),
                dataType: "json",
                success: function (data) {
                    if (parseInt(data.info) == 1) {
                        markBad("#titlespan","#batitle");
                    }
                    else {
                        markGood("#titlespan","#batitle");
                    }
                },
                error: function () {
                    $('#errBook').html('проблемы соединения с сервером');
                }
            });
        }
    });
}

function addButtonF() {
    newKWList = [];
    $(".listKW").each(function (key, value) {
        newKWList.push($(this).html());

    });
    newAuthList = [];
    $(".listA").each(function (key, value) {
        newAuthList.push($(this).html());
    });
    if (newAuthList.length == 0) {
        $("#errBook").html('Выберите авторов');
    } else if ($("#baisbn").hasClass("badField")){
        $("#errBook").html('Такая книга уже есть добавьте экземпляр');
    } else if ($("#batitle").hasClass("badField")){
        $("#errBook").html('Есть похожая книга');
    }
    else {
        $.ajax({
            type: "POST",
            url: "/addbajax",
            data: JSON.stringify({'link': $('#balink').val(),
                'isbn': $('#baisbn').val(),
                'title': $('#batitle').val(),
                'authors': newAuthList,
                'lang': $('#balang').val(),
                'keywords': newKWList,
                'desc': $('#badisc').val(),
                'val':$('.valR:checked').val()}),
            dataType: "json",
            success: function (data) {
                if (parseInt(data.info) == 1) {
                    $('#errBook').html('добавлено');
                }
                else if (parseInt(data.info) == 2) {
                    $('#errBook').html('такая книгу уже есть');
                }
                else if (parseInt(data.info) == 3) {
                    $('#errBook').html('что-то не работает');
                }
            },
            error: function () {
                $('#errBook').html('проблемы соединения с сервером');
            }
        });
    }
}

function addWordInList(word) {
    $(".dKeyList").append('<li class="dKWList">' + word + '</li>');
}
function addWordList() {
    $(".dKeyList").html('');
    for (i in keywords) {
        addWordInList(keywords[i]);
    }
}
function addAuthorInList(word) {
    $(".dAuthlist").append('<li class="dAList">' + word + '</li>');
}
function addAurhorList() {
    $(".dAuthlist").html('');
    for (i in authors) {
        addAuthorInList(authors[i]);
    }
}

function setDialogKeywords() {
    $('#dialogKeywords').dialog({
        autoOpen: false,
        modal: true,
        resizable: false,
        width: 250,
        height: 300,
        close: function () {
            $('#dKeyInput').prop('value', '');
            addWordList();
        }
    });
    $('#addKeyW').click(function () {
        $('#dialogKeywords').dialog('open');
    });
    addWordList();
    $("#dKeyInput").live("keyup", function () {
        var searchWord = $(this).val();
        $(".dKeyList").html('');
        if (searchWord.length >= 1) {
            var k = 0;
            for (i in keywords) {
                if (keywords[i].match(new RegExp(searchWord, "i"))) {
                    addWordInList(keywords[i]);
                    k++;
                }
            }
            if (k == 0) {
                $(".dKeyList").append('<input class="isButton" value="Добавить" id="dNewKWBut"/></input>')
            }
        } else {
            addWordList();
        }
        $(this).change();
    });
    $('.listKW').live('click', function () {
        $(this).remove();
    });
    $('#dNewKWBut').live('click', function () {
        $("#bakeyw").append('<span class="listKW">' + $("#dKeyInput").val() + '</span>')
//                    $('#keyWordsList').dialog('close');
    });
    $('.dKWList').live('click', function () {
        $("#bakeyw").append('<span class="listKW">' + $(this).html() + '</span>')
//                    $('#keyWordsList').dialog('close');
    });
    $('#dKeyInput').keydown(function (event) {
        if (event.keyCode == 13) {
            $('#dNewKWBut').click();
        }
    });

}
function setDialogAuthors() {
    $('#dialogAuthors').dialog({
        autoOpen: false,
        modal: true,
        resizable: false,
        width: 250,
        height: 300,
        close: function () {
            $('#dAuthInput').prop('value', '');
            addAurhorList();
        }
    });
    $('#addAuth').click(function () {
        $('#dialogAuthors').dialog('open');
    });
    addAurhorList();
    $('#addAuth').click(function () {
        $('#dialogAuthors').dialog('open');
    });
    $("#dAuthInput").bind("keyup", function () {
        var searchAuthor = $(this).val();

        $(".dAuthlist").html('');
        if (searchAuthor.length >= 1) {
            var k = 0;
            for (i in authors) {
                if (authors[i].match(new RegExp(searchAuthor, "i"))) {
                    addAuthorInList(authors[i]);
                    k++;
                }
            }
            if (k == 0) {
                $(".dAuthlist").append('<input class="isButton" value="Добавить" id="dNewABut"/></input>')
            }
        } else {
            addAurhorList();
        }
        $(this).change();
    });
// добавление
//                $(".addW").each(function (key, value){
//                    console.log($(this).html());
//                });
    $('.listA').live('click', function () {
        $(this).remove();
    });
    $('#dNewABut').live('click', function () {
        $("#baauth").append('<span class="listA">' + $("#dAuthInput").val() + '</span>')
//                    $('#keyWordsList').dialog('close');
    });
    $('.dAList').live('click', function () {
        $("#baauth").append('<span class="listA">' + $(this).html() + '</span>')
//                    $('#keyWordsList').dialog('close');
    });
    $('#dAuthInput').keydown(function (event) {
        if (event.keyCode == 13) {
            $('#dNewABut').click();
        }
    });
}