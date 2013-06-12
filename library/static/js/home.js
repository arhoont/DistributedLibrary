var page = {
    size: 20,
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
        error: function () {
            serverError();
        },
        crossDomain: false
    });
}
function castMainTable(data) {
    $("#rows").html("");
    var k = data.books.length;
    for (i = 0; i < k; i++) {
        var book = data.books[i];
        listed = '<tr class="oneRow" id=' + book.pk + '>';
        listed += '<td class="isbnColum"><a href="/book/info?isbn=' + book.pk + '">' + book.pk + '</a></td>';
        listed += '<td class="titleColum"><a title="' + book.fields.title + '" href="/book/info?isbn=' + book.pk + '">' + book.fields.title + '</a></td>';
        listed += '<td class="authColum" title="' + book.fields.authors + '">' + book.fields.authors + '&nbsp</td>';
        listed += '<td class="keyColum" title="' + book.fields.keywords + '">' + book.fields.keywords + '</td>';
        listed += '<td class="langColum" >' + book.fields.language + '</td>';
        listed += '<td class="countColum">' + book.fields.item_count + '&nbsp</td>';
        listed += '<td class="ratingColum">';
        for (var j = 0; j < book.fields.rating; j++) {
            listed += '<i class="icon-star icon-white"></i>';
        }
        listed += '&nbsp</td>'

        listed += '</tr>';
        $("#rows").append(listed);
    }


    $("#page").html(page.num.toString());
    if (data.count <= page.num * page.size) {
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