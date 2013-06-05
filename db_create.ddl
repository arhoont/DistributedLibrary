drop function recount_items (isbn varchar);
create or replace function recount_items (in_isbn varchar) returns int
  as $$
  begin
    update library_book set item_count=
      (select count(*) from library_bookitem where book_id=isbn)
    where isbn=in_isbn;
    return null;
  end;
  $$
LANGUAGE plpgsql;

create or replace function f_new_item() returns trigger
  as $$
  begin
    insert into library_itemstatus (item_id, status, date) values (new.id,1,CURRENT_TIMESTAMP);
    perform recount_items (new.book_id);
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

create or replace function f_ch_return_item () returns trigger
  as $$
  declare
    mr record;
  begin
    update library_bookitem set (reader_id,takedate) = (owner_id,CURRENT_TIMESTAMP) where id=new.item_id;
    return null ;
  end;
  $$
LANGUAGE plpgsql;

create trigger creturn_item
  after insert on library_returnmessage
  for each row
  execute procedure f_ch_return_item();

create or replace function re_count_rating () returns int
  as $$
  begin
    update library_book set rating=(select CAST(avg(library_opinion.rating)as float8)
                                    from library_opinion where book_id=isbn);
    return null ;
  end;
  $$
LANGUAGE plpgsql;

insert into library_syssetting values (1,1,10,'lib1');

insert into library_domain values (' ');

insert into library_language values ('Русский');
insert into library_language values ('English');