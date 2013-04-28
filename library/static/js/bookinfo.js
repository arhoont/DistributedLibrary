function castPage() {
    $("#addItemBut").click(function () {
        $("#takeModal").modal('show');
    });
    $("#addItemB").click(function () {
        $("#takeModal").modal('hide');
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
                'opiniontext':$.trim($("#opinionTextArea").val())}),
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
}