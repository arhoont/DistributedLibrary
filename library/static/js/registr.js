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
                    serverError();
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
        displayAlert('Пароли несовпадают',"alert-danger");
    } else if ($("#reg-logF").hasClass("badField")) {
        displayAlert('такой логин уже есть',"alert-danger");
    } else {
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
                } else if (parseInt(data.info) == 2) {
                    displayAlert('такой логин уже есть',"alert-danger");
                }
            },
            error: function () {
                serverError();
            }
        });
    }
}