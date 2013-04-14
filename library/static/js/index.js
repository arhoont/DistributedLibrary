function castPage(){
    $.ajax({
        url: "/getbooks",
        type: "post",
        dataType: "json",
        success: function (data) {
            console.log(data.info);
        },
        crossDomain: false
    });
}