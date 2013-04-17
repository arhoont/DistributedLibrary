function castPage() {

    $('#regForm').submit(function (e) {
        e.preventDefault();
        register();
    });
    $("#reg-logF").focusout(function () {
        if ($("#reg-logF").val().length > 0) {
            $.ajax({
                type: "POST",
                url: "/checkUser",
                data: JSON.stringify({'type': 1, 'login': $("#reg-logF").val()}),
                dataType: "json",
                success: function (data) {
                    if (parseInt(data.info) == 1) {
                        markBad("#logspan","#reg-logF");
                    }
                    else {
                        markGood("#logspan","#reg-logF");
                    }
                },
                error: function () {
                    $('#regError').html('проблемы соединения с сервером');
                }
            });
        }
    });
    $("#reg-passRe").focusout(function () {
        pwdTest();
    });
    $("#reg-pass").focusout(function () {
        pwdTest();
    });
}
function pwdTest() {
    isconc = $('#reg-pass').val() == $('#reg-passRe').val();
    if (!isconc) {
        $("#passspn").html('<img src="' + path + 'img/close.png"/>');
        $("reg-passRe").removeClass("goodField");
    }
    else {
        $("#passspn").html('<img src="' + path + 'img/tick.png"/>');
        $("#reg-passRe").addClass("goodField");
    }
    return isconc;
}
function register() {

    if (!pwdTest()) {
        $('#regError').html('пароли не совпадают');
    } else if ($("#reg-logF").hasClass("badField")) {
        $('#regError').html('такой логин уже есть');
    } else {
        $('#regError').html('');
        $.ajax({
            type: "POST",
            url: "/regajax",
            data: JSON.stringify({'log': $('#reg-logF').val(), 'email': $('#reg-email').val(),
                'fname': $('#reg-fname').val(), 'lname': $('#reg-lname').val(),
                'pwd': $('#reg-pass').val()}),
            dataType: "json",
            success: function (data) {
                console.log(data);
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