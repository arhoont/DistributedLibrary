CREATE or replace FUNCTION take_authors(isbnIn varchar) RETURNS text AS $$
DECLARE
  authors text;
  author text;
BEGIN
  authors='';
  FOR author IN select fname || ' ' ||  lname from library_author where id in
    (select author_id from library_book_authors where book_id=isbnIn) LOOP
    authors:=authors ||', '|| author;
  END LOOP;
  return substr(authors,3);
END;
$$  LANGUAGE plpgsql;

CREATE or replace FUNCTION take_keywords(isbnIn varchar) RETURNS text AS $$
DECLARE
  keywords text;
  keyword text;
BEGIN
  keywords='';
  FOR keyword IN select keyword_id from library_book_keywords where book_id=isbnIn LOOP
    keywords:=keywords ||', '|| keyword;
  END LOOP;
  return substr(keywords,3);
END;
$$  LANGUAGE plpgsql;

CREATE or replace FUNCTION take_keywords(isbnIn varchar) RETURNS text AS $$
DECLARE
  keywords text;
  keyword text;
  cur cursor for select * from library_book_keywords where book_id=isbnIn;
BEGIN
  keywords='';
  FOR keyword IN cur LOOP
    keywords:=keywords ||', '|| keyword.keyword_id;
  END LOOP;
  return substr(keywords,3);
END;
$$  LANGUAGE plpgsql;

CREATE or replace FUNCTION getFormatedBooks(page int, count int) RETURNS table(
  isbn varchar, title varchar , authors text , keywords text, language varchar , itemcount int ,rating float
) AS $$
declare
  curtb cursor FOR select library_book.isbn, library_book.title, take_authors(library_book.isbn) as authors, take_keywords(library_book.isbn) as keywords,
  language_id as language, cast((select count(*) from library_bookitem where library_bookitem.book_id=library_book.isbn) as int)as itemcount,
  library_book.rating
  from library_book
  group by library_book.isbn;
  frow int;
  que text;
BEGIN
    frow = (page-1)*count;
    OPEN curtb;
    move FORWARD frow from curtb;
    que='fetch '||count||' curtb;';
    return query execute (que);
    close curtb;
END;
$$ LANGUAGE plpgsql;

CREATE or replace FUNCTION getPersonBooks(pid int, rot varchar) RETURNS table(
  isbn varchar, title varchar,authors text,keywords text, language varchar, itemcount int, rating float)
as $$
declare
  que text;
BEGIN
  que='select isbn,library_book.title, take_authors(isbn), take_keywords(isbn)
              ,language_id as language, cast(count(*) as int), rating from library_bookitem join
              library_book on book_id=isbn where '||rot||'='||pid||' group by isbn';
  return query execute (que);
END;
$$  LANGUAGE plpgsql;


create or replace function f_new_item() returns trigger
  as $$
  begin
    insert into library_itemstatus (item_id, status, date) values (new.id,1,CURRENT_TIMESTAMP);
    return null;
  end;
  $$
LANGUAGE plpgsql;

create trigger new_item
  after insert on library_bookitem
  for each row
  execute procedure f_new_item();

create or replace function f_ch_mess_item () returns trigger
  as $$
  declare
    mr record;
  begin
    select item_id, value, "personFrom_id" into  mr from library_conversation join library_bookitem
    on library_conversation.item_id=library_bookitem.id
    where library_conversation.id = new.conversation_id;
    if (new.mtype=mr.value and new.resp=1)then
      update library_bookitem set (reader_id,takedate) = (mr."personFrom_id",CURRENT_TIMESTAMP) where id=mr.item_id;
    end if;
    return null ;
  end;
  $$
LANGUAGE plpgsql;

create trigger ch_mess_item
  after insert on library_message
  for each row
  execute procedure f_ch_mess_item();

create or replace function f_new_opinion () returns trigger
  as $$
  begin
    update library_book set rating=(select CAST(avg(library_opinion.rating)as float8)
                                    from library_opinion where book_id=isbn)
    where isbn=new.book_id;
    return null;
  end;
  $$
LANGUAGE plpgsql;

create trigger new_opinion
  after insert on library_opinion
  for each row
  execute procedure f_new_opinion();

create or replace function re_count_rating () returns int
  as $$
  begin
    update library_book set rating=(select CAST(avg(library_opinion.rating)as float8)
                                    from library_opinion where book_id=isbn);
    return null ;
  end;
  $$
LANGUAGE plpgsql;

drop view allbooks;
create or replace view allbooks as
select isbn, title, take_authors(isbn) as authors, take_keywords(isbn) as keywords,
  language_id as language, (select count(*) from library_bookitem where library_bookitem.book_id=isbn) as itemcount,
  rating
  from library_book
  group by isbn;

