function castPage(){
    $.ajax({
        url: "/getlastbooks",
        type: "post",
        dataType: "json",
        data: JSON.stringify({"count":6}),
        success: function (data) {
            castMainTable(data);
        },
        error: function () {
            serverError();
        },
        crossDomain: false
    });
    var d = new Date()
    var n = d.getTimezoneOffset();
    if (n==-240){
        $("#django_timezone").val("Europe/Moscow");
    }
    console.log(n);
}
function castMainTable(objForm) {
    $("#rows").html("");
    var k = objForm.books.length;
    for (i = 0; i < k; i++) {
        var isbn = objForm.books[i][0];
        listed = '<tr class="oneRow" id=' + isbn + '>';
        listed += '<td class="titleColum">' + objForm.books[i][1] + '&nbsp</td>';
        listed += '<td class="authColum">' + objForm.books[i][2] + '</td>';
        listed += '<td class="langColum">' + objForm.books[i][3] + '</td>';
        listed += '</tr>';
        $("#rows").append(listed);
    }
}