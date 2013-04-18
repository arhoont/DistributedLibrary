var page = {
    size: 4,
    num: 1
};
var search = {
    type: 0,
    word: ""
};

var sort ={
    type: 0,
    field: "isbn"
};
function castPage(){
    tableReq();
    $("#prevButP").click(function (e) {
        if ((page.num > 1) && (!$("#prevBut").hasClass('disabled'))) {
            page.num--;
            tableReq();
        }
    });
    $("#nextButA").click(function (e) {
        if (!$("#nextBut").hasClass('disabled')) {
            page.num++;
            tableReq();
        }
    });
    $('#searchButton').click(function () {
        if ($("#searchInput").val().length > 0) {
            search.word = $("#searchInput").val();
            search.type = 1;
            page.num=1;
            tableReq();
        } else {
            search.word = "";
            search.type = 0;
            page.num=1;
            tableReq();
        }
    });
    $('#searchInput').keydown(function (event) {
        if (event.keyCode == 13) {
            $('#searchButton').click();
        }
    });
    var d = new Date()
    var n = d.getTimezoneOffset();
    console.log(n);
    $('#tabletabs a').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
    })
}

function changeSort(field){
    if (field==sort.field){
        if (sort.type==0){
            sort.type=1;
        } else {
            sort.type=0;
        }
    } else {
        sort.field=field;
        sort.type=0;
    }
    tableReq();
}
function tableReq(){
    $.ajax({
        url: "/getbooks",
        type: "post",
        dataType: "json",
        data: JSON.stringify({"search":{"type":search.type,"word":search.word},
            "sort":{"type":sort.type,"field":sort.field},
            "page":{"size":page.size,"num":page.num}}),
        success: function (data) {
            castMainTable(data);
        },
        crossDomain: false
    });
}
function castMainTable(objForm) {
    $("#rows").html("");
    var k = objForm.books.length;
    for (i = 0; i < k; i++) {
        var isbn = objForm.books[i][0];
        listed = '<tr class="oneRow" id=' + isbn + '>';
        listed += '<td class="isbnColum"><a href="/book?isbn='+isbn+'">' + objForm.books[i][0] + '</a></td>';
        listed += '<td class="titleColum"><a href="/book?isbn='+isbn+'">' + objForm.books[i][2] + '</a></td>';
        listed += '<td class="authColum">' + objForm.books[i][4] + '&nbsp</td>';
        listed += '<td class="keyColum">' + objForm.books[i][5] + '</td>';
        listed += '<td class="langColum">' + objForm.books[i][3] + '</td>';

        listed += '<td class="ratingColum">';
        var rating = objForm.books[i][6];
        for (var j = 0; j < objForm.books[i][6]; j++) {
            listed += '<span>&#9734;</span>';
        }
        listed += '&nbsp</td>'
        listed += '<td class="countColum">' + objForm.books[i][7] + '&nbsp</td>';
        listed += '</tr>';
//        listed += '<div class="separator"></div>';
        $("#rows").append(listed);
    }


    $("#page").html(page.num.toString());
    if (objForm.count<=page.num*page.size) {
//        $("#nextBut").removeClass("actNB");
        $("#nextBut").addClass("disabled");
    } else {
        $("#nextBut").removeClass("disabled");
//        $("#nextBut").addClass("actNB");
    }
    if (page.num == 1) {
        $("#prevBut").addClass("disabled");
//        $("#prevBut").addClass("disabled");
    } else {
        $("#prevBut").removeClass("disabled");
//        $("#prevBut").addClass("actNB");
    }

}