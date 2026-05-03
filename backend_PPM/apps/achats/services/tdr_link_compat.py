from functools import lru_cache

from django.db import connection

TDR_DOCUMENT_TABLE = "tdr_st_document"
TDR_DEMANDE_LINK_COLUMN = "demande_achat_id"


@lru_cache(maxsize=1)
def has_tdr_demande_link_column() -> bool:
    try:
        with connection.cursor() as cursor:
            table_names = set(connection.introspection.table_names(cursor))
            if TDR_DOCUMENT_TABLE not in table_names:
                return False

            description = connection.introspection.get_table_description(
                cursor,
                TDR_DOCUMENT_TABLE,
            )
    except Exception:
        return False

    return any(
        getattr(column, "name", column[0]) == TDR_DEMANDE_LINK_COLUMN
        for column in description
    )


def with_optional_tdr_select_related(queryset, *base_fields):
    fields = [field for field in base_fields if field]

    if has_tdr_demande_link_column():
        fields.append("tdr_st_document")

    if not fields:
        return queryset

    return queryset.select_related(*fields)
