CREATE or replace FUNCTION getRating(isbnIn varchar) RETURNS float AS $$
BEGIN
  return (select CAST(avg(library_opinion.rating)as float8)  from library_opinion where book_id=isbnIn);
END;
$$  LANGUAGE plpgsql;

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

CREATE or replace FUNCTION getPersonBooks(pid int, rot varchar) RETURNS table(
  isbn varchar, title varchar,authors text,keywords text, language varchar, itemcount int, rating float)
as $$
declare
  que text;
BEGIN
  que='select isbn,library_book.title, take_authors(isbn), take_keywords(isbn)
              ,language_id as language, cast(count(*) as int), getrating(isbn) from library_bookitem join
              library_book on book_id=isbn where '||rot||'='||pid||' group by isbn';
  return query execute (que);
END;
$$  LANGUAGE plpgsql;



drop view allbooks;
create or replace view allbooks as
select isbn, title, take_authors(isbn) as authors, take_keywords(isbn) as keywords,
  language_id as language, (select count(*) from library_bookitem where library_bookitem.book_id=isbn) as itemcount,
  getrating(isbn) as rating
  from library_book
  group by isbn;


insert into library_domain values (' ');
insert into library_language values ('Русский');
insert into library_language values ('English');
insert into library_syssetting values (1,1,300);



