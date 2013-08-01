function castPage() {

    $('#reg-form').submit(function (e) {
        e.preventDefault();
        register();
    });
    $("#reg-login").focusout(function () {
        if ($("#reg-login").val().length > 0) {
            $.ajax({
                type: "POST",
                url: "/checkUser",
                data: JSON.stringify({'qtype': 'login', 'info': $("#reg-login").val()}),
                dataType: "json",
                success: function (data) {
                    if (parseInt(data.info) == 1) {
                        markBad("#reg-login-cg", "Такой уже есть");
                    }
                    else {
                        markGood("#reg-login-cg", "");
                    }
                },
                error: function () {
                    serverError();
                },
                crossDomain: false
            });
        }
    });
    $("#reg-email").focusout(function () {
        if ($("#reg-email").val().length > 0) {
            filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
            if (filter.test($("#reg-email").val())) {
                $.ajax({
                    type: "POST",
                    url: "/checkUser",
                    data: JSON.stringify({'qtype': 'email', 'info': $("#reg-email").val()}),
                    dataType: "json",
                    success: function (data) {
                        if (parseInt(data.info) == 1) {
                            markBad("#reg-email-cg", "Такой уже есть");
                        }
                        else {
                            markGood("#reg-email-cg", "");
                        }
                    },
                    error: function () {
                        serverError();
                    },
                    crossDomain: false
                });
            }
            else {
                markBad("#reg-email-cg", "Введите правильный");
            }

        }
    });
    $("#reg-pwdd").focusout(function () {
        pwdTest();
    });
}
function pwdTest() {
    isconc = $('#reg-pwd').val() == $('#reg-pwdd').val();
    if (isconc) {
        markGood("#reg-pwdd-cg", "");
    } else {
        markBad("#reg-pwdd-cg", "Должны совпадать");

    }
    return isconc;
}
function register() {
    if (!pwdTest()) {
        displayAlert('Пароли не совпадают', "alert-danger");
    } else if ($("#reg-login-cg").hasClass("error")) {
        displayAlert('Такой логин уже существует', "alert-danger");
    } else if ($("#reg-email-cg").hasClass("error")) {
        displayAlert('Аккаунт с таким email уже существует', "alert-danger");
    } else {
        $.ajax({
            type: "POST",
            url: "/regajax",
            data: JSON.stringify({'login': $('#reg-login').val(), 'email': $('#reg-email').val(),
                'fname': $('#reg-fname').val(), 'lname': $('#reg-lname').val(),
                'pwd': $('#reg-pwd').val(), 'phone_ext':$('#reg-ext').val()}),
            dataType: "json",
            success: function (data) {
                if (parseInt(data.info) == 1) {
                    window.location = "/login";
                } else if (parseInt(data.info) == 2) {
                    displayAlert('Такой логин уже существует', "alert-danger");
                } else if (parseInt(data.info) == 2) {
                    displayAlert('Аккаунт с таким email уже существует', "alert-danger");
                }
            },
            error: function () {
                serverError();
            }
        });
    }
}
