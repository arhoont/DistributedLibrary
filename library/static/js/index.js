function castPage() {
    $.ajax({
        url: "/getlastbooks",
        type: "post",
        dataType: "json",
        data: JSON.stringify({"count": 6}),
        success: function (data) {
            castMainTable(data);
        },
        error: function () {
            serverError();
        },
        crossDomain: false
    });

    var d = new Date();
    var n = d.getTimezoneOffset();
    if (n == -240) {
        $("#django_timezone").val("Europe/Moscow");
    }

    console.log(n);
    $("#forgot-pwd").click(function () {
        $("#pwd-recovery-modal").modal('show');
    });
    $("#pwd-recovery-btn").click(function () {
        $.ajax({
            url: "/passwordRecovery",
            type: "post",
            dataType: "json",
            data: JSON.stringify({"email": $("#pwd-recovery").val()}),
            success: function (data) {
                if (parseInt(data.info) == 1) {
                    displayAlert("Новый пароль отправлен на указанный email");
                    $("#pwd-recovery-modal").modal('hide');

                } else if (parseInt(data.info) == 2) {
                    markBad('#pwd-recovery-cg','Такого email нет в системе');
                }
            },
            error: function () {
                serverError();
            },
            crossDomain: false
        });
    });
    $("#pwd-recovery").focus(function(){
        removeMark('#pwd-recovery-cg');
    });
}
function castMainTable(data) {
    $("#rows").html("");
    for (i = 0; i < data.length; i++) {
        listed = '<tr class="oneRow" id=' + data[i].pk + '>';
        listed += '<td class="titleColum" title="' + data[i].fields.title + '">' + data[i].fields.title + '&nbsp</td>';
        listed += '<td class="authColum" title="' + data[i].fields.authors + '">' + data[i].fields.authors + '</td>';
        listed += '<td class="langColum"  title="' + data[i].fields.language + '">' + data[i].fields.language + '</td>';
        listed += '</tr>';
        $("#rows").append(listed);
    }
}