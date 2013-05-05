var page = {
    size: 4,
    num: 1
};
var search = {
    word: "",
    person: 1
};

var sort = {
    type: 0,
    field: "isbn"
};
function castPage() {
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
            page.num = 1;
            tableReq();
        } else {
            search.word = "";
            page.num = 1;
            tableReq();
        }
    });
    $('#searchInput').keydown(function (event) {
        if (event.keyCode == 13) {
            $('#searchInput').blur();
            $('#searchButton').click();
        }
    });

    $('#tabletabs a').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
    });
    $("#readingBooks").click(function () {
        search.person = 1;
        tableReq();
    });
    $("#allBooks").click(function () {
        search.person = 0;
        tableReq();
    });
    $("#myBooks").click(function () {
        search.person = 2;
        tableReq();
    });
}

function clearSearch() {
    $('#searchInput').val("");
    $('#searchButton').click();

}

function changeSort(field) {
    if (field == sort.field) {
        if (sort.type == 0) {
            sort.type = 1;
        } else {
            sort.type = 0;
        }
    } else {
        sort.field = field;
        sort.type = 0;
    }
    tableReq();
}
function tableReq() {
    $.ajax({
        url: "/getbooks",
        type: "post",
        dataType: "json",
        data: JSON.stringify({"search": {"word": search.word, "person": search.person},
            "sort": {"type": sort.type, "column": sort.field},
            "page": {"size": page.size, "num": page.num}}),
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
        listed += '<td class="isbnColum"><a href="/book/info?isbn=' + isbn + '">' + isbn + '</a></td>';
        listed += '<td class="titleColum"><a title="' + objForm.books[i][1] + '" href="/book/info?isbn=' + isbn + '">' + objForm.books[i][1] + '</a></td>';
        listed += '<td class="authColum" title="' + objForm.books[i][2] + '">' + objForm.books[i][2] + '&nbsp</td>';
        listed += '<td class="keyColum" title="' + objForm.books[i][3] + '">' + objForm.books[i][3] + '</td>';
        listed += '<td class="langColum" >' + objForm.books[i][4] + '</td>';
        listed += '<td class="countColum">' + objForm.books[i][5] + '&nbsp</td>';
        listed += '<td class="ratingColum">';
        for (var j = 0; j < objForm.books[i][6]; j++) {
            listed += '<i class="icon-star icon-white"></i>';
        }
        listed += '&nbsp</td>'

        listed += '</tr>';
        $("#rows").append(listed);
    }


    $("#page").html(page.num.toString());
    if (objForm.count <= page.num * page.size) {
        $("#nextBut").addClass("disabled");
    } else {
        $("#nextBut").removeClass("disabled");
    }
    if (page.num == 1) {
        $("#prevBut").addClass("disabled");
    } else {
        $("#prevBut").removeClass("disabled");
    }

}