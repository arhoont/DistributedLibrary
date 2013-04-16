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
    $("#prevBut").click(function () {
        if ((page.num > 1) && ($("#prevBut").hasClass('actNB'))) {
            page.num--;
            tableReq();
        }
    });
    $("#nextBut").click(function () {
        if ($("#nextBut").hasClass('actNB')) {
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
        listed = '<div class="oneRow" id=' + isbn + '>';
        listed += '<div class="blockIsbn blocks"><a href="/book?isbn='+isbn+'">' + objForm.books[i][0] + '</a></div>';
        listed += '<div class="blockOzon blocks"><a href="'+objForm.books[i][1]+'">' + objForm.books[i][1] + '</a></div>';
        listed += '<div class="blockTitle blocks"><a href="/book?isbn='+isbn+'">' + objForm.books[i][2] + '</a></div>';
        listed += '<div class="blockLanguage blocks">' + objForm.books[i][3] + '</div>';
        listed += '<div class="blockAuthor blocks">' + objForm.books[i][4] + '&nbsp</div>';
        listed += '<div class="blockKeyWords blocks">' + objForm.books[i][5] + '</div>';
        listed += '<div class="blockRating blocks">';
        var rating = objForm.books[i][6];
        for (var j = 0; j < objForm.books[i][6]; j++) {
            listed += '<span>&#9734;</span>';
        }
        listed += '&nbsp</div>'
        listed += '<div class="blockCount blocks">' + objForm.books[i][7] + '&nbsp</div>';
        listed += '</div>';
        listed += '<div class="separator"></div>';
        $("#rows").append(listed);
    }
    $("#page").html(page.num.toString());
    if (objForm.count<=page.num*page.size) {
        $("#nextBut").removeClass("actNB");
        $("#nextBut").addClass("nactNB");
    } else {
        $("#nextBut").removeClass("nactNB");
        $("#nextBut").addClass("actNB");
    }
    if (page.num == 1) {
        $("#prevBut").removeClass("actNB");
        $("#prevBut").addClass("nactNB");
    } else {
        $("#prevBut").removeClass("nactNB");
        $("#prevBut").addClass("actNB");
    }
}