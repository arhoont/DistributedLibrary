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
                data: JSON.stringify({'type': 1, 'login': $("#reg-login").val()}),
                dataType: "json",
                success: function (data) {
                    if (parseInt(data.info) == 1) {
                        markBad("#reg-login-cg","Такой уже есть");
                    }
                    else {
                        markGood("#reg-login-cg","");
                    }
                },
                error: function () {
                    $('#regError').html('проблемы соединения с сервером');
                },
                crossDomain: false
            });
        }
    });
    $("#reg-pwdd").focusout(function () {
        pwdTest();
    });
}
function pwdTest() {
    isconc = $('#reg-pwd').val() == $('#reg-pwdd').val();
    if (isconc){
        markGood("#reg-pwdd-cg","");
    } else {
        markBad("#reg-pwdd-cg","Должны совпадать");

    }
    return isconc;
}
function register() {
    if (!pwdTest()) {
        $('#regError').html('пароли не совпадают');
    } else if ($("#reg-logF").hasClass("badField")) {
        $('#regError').html('такой логин уже есть');
    } else {
//        $('#reg-form').html('');
        $.ajax({
            type: "POST",
            url: "/regajax",
            data: JSON.stringify({'login': $('#reg-login').val(), 'email': $('#reg-email').val(),
                'fname': $('#reg-fname').val(), 'lname': $('#reg-lname').val(),
                'pwd': $('#reg-pwd').val()}),
            dataType: "json",
            success: function (data) {
                if (parseInt(data.info) == 1) {
                    window.location = "/login";
                }

                else if (parseInt(data.info) == 2) {
                    $('#regError').html('такой логин уже есть');
                }
                else if (parseInt(data.info) == 3) {
                    $('#regError').html('что-то не работает');
                }
                else if (parseInt(data.info) == 4) {
                    $('#regError').html('войдите или зарегистрируетесь');
                }
            },
            error: function () {
                $('#regError').html('проблемы соединения с сервером');
            }
        });
    }
}