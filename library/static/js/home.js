var page = {
    size: 20,
    num: 1
};
var search = {
    word: "",
    person: "reading"
};

var sort = {
    type: 0,
    field: "isbn"
};

var local="home";
function castPage() {
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

    recoverState();

    $("#readingB").click(function () {
        search.person = "reading";
        page.num = 1;
        tableReq();
    });
    $("#allB").click(function () {
        search.person = "all";
        page.num = 1;
        tableReq();
    });
    $("#owningB").click(function () {
        search.person = "owning";
        page.num = 1;
        tableReq();
    });
    tableReq();
    $('#messageModal').on('hidden', function () {
        tableReq();
    });
}



function insertParam() {
    parent.location.hash = "?" + $.param({'sew': search.word, 'sep': search.person,
        'sot': sort.type, 'sof': sort.field, 'pan': page.num.toString()});
}

function recoverState() {
    var url_params = getUrlParams();
    if (!url_params) {
        $("#readingB").click();
        return;
    }
    search.word = decodeURIComponent(url_params.sew);
    search.person = url_params.sep;
    sort.type = parseInt(url_params.sot);
    sort.field = url_params.sof;
    page.num = url_params.pan;
    $("#searchInput").val(search.word);
    $("#" + search.person + "B").click();
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
    insertParam();
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

        listed += '<td class="ownersColumn" title="' + book.fields.owners + '">' + book.fields.owners + '</td>';

        listed += '</tr>';
        $("#rows").append(listed);
    }


    $("#page").html(page.num.toString()+"/"+Math.ceil(data.count));
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