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
    var d = new Date();
    var n = d.getTimezoneOffset();
    if (n==-240){
        $("#django_timezone").val("Europe/Moscow");
    }
    console.log(n);
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