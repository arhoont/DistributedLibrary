function castPage() {
    $("#pwdA").click(function () {
        $("#changePwdModal").modal('show');
    });
    $("#reg-pwdd").focusout(function () {
        pwdTest();
    });
}
function pwdTest() {
    isconc = $('#reg-pwd').val() == $('#reg-pwdd').val() && $('#reg-pwd').val().length != 0;
    if (isconc) {
        markGood("#reg-pwdd-cg", "");
    } else {
        markBad("#reg-pwdd-cg", "Не совпадает");

    }
    return isconc;
}

function changeRow(val) {
    $("." + val + "tr .valcolumn").html('<input type="text" id="i' + val + '"class="input-medium" value="' + person[val] + '">');
    $("." + val + "tr .rcolumn").html('<a class="saveA" onclick="save(\'' + val + '\')">Сохранить</a> <a onclick="cancel(\'' + val + '\')">Отмена</a>');
}

function save(val) {
    $.ajax({
        type: "POST",
        url: "/editUserAjax",
        data: JSON.stringify({
            'field': val,
            'param': $("#i" + val).val()}),
        dataType: "json",
        success: function (data) {
            if (parseInt(data.info) == 1) {
                person[val] = data.val;
                cancel(val);
            } else if (parseInt(data.info) == 4) {
                notSignIn();
            }
        },
        error: function () {
            serverError();
        }
    });

}
function cancel(val) {
    $("." + val + "tr .valcolumn").html(person[val]);
    $("." + val + "tr .rcolumn").html('<a onclick="changeRow(\'' + val + '\')">Редактировать</a>');
}


function register() {
    if (!pwdTest()) {
    } else if ($('#old-pwd').val() == 0) {
        markBad("#old-pwdd-cg", "Пустой");
    }
    else {
        markGood("#old-pwdd-cg", "");
        $.ajax({
            type: "POST",
            url: "/editUserAjax",
            data: JSON.stringify({
                'field': "pwd",
                'param': $('#reg-pwd').val(),
                'old-pwd': $('#old-pwd').val()}),
            dataType: "json",
            success: function (data) {
                if (parseInt(data.info) == 1) {
                    $("#changePwdModal").modal('hide');
                    displayAlert("Пароль изменен", "alert-success");
                } else if (parseInt(data.info) == 2) {
                    markBad("#old-pwdd-cg", "Не правильно");
                }
            },
            error: function () {
                $("#changePwdModal").modal('hide');
                serverError();
            }
        });
    }
}