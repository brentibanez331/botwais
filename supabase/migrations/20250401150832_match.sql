create or replace function match_document_sections(
  embedding vector(1536),
  match_threshold float
)
returns setof document_sections
language plpgsql
as $$
#variable_conflict use_variable
begin
  return query
  select *
  from document_sections
  where (document_sections.embedding <=> embedding) < 1 - match_threshold
	order by document_sections.embedding <=> embedding;
end;
$$;