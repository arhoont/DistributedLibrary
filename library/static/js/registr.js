function castPage(){

    $('#regForm').submit(function (e) {
        e.preventDefault();
//        register();
    });
}

function register() {
    if ($('#reg-pass').val() == $('#reg-passRe').val()) {
        $('#regError').html('');
        $.ajax({
            type: "POST",
            url: "/registrajax",
            data: JSON.stringify({'log': $('#reg-logF').val(), 'email': $('#reg-email').val(),
                'fname': $('#reg-fname').val(), 'lname': $('#reg-lname').val(),
                'pwd': $('#reg-pass').val()}),
            dataType: "json",
            success: function (data) {
                console.log(data);
                if (parseInt(data.info) == 1) {
                    userInfo.id = data.userID;
                    userInfo.login = data.login;
                    $('#div-regForm').dialog("close");
                    accLogin();
                }
                else if (parseInt(data.info) == 2) {
                    $('#regError').html('такой логин уже есть');
                }
                else if (parseInt(data.info) == 3) {
                    $('#regError').html('что-то не работает');
                }
            },
            error: function () {
                $('#regError').html('проблемы соединения с сервером');
            }
        });
    } else {
        $('#regError').html('пароли не совпадают');
    }
}