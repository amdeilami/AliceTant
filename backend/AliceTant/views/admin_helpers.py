from django.core.paginator import Paginator


def parse_bool(value):
    if value is None or value == '':
        return None
    return str(value).lower() in {'1', 'true', 'yes', 'on'}


def paginate_queryset(request, queryset, serializer_class, context=None):
    page = max(int(request.query_params.get('page', 1)), 1)
    page_size = min(max(int(request.query_params.get('page_size', 20)), 1), 100)
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)
    serializer = serializer_class(page_obj.object_list, many=True, context=context or {})
    return {
        'count': paginator.count,
        'page': page_obj.number,
        'page_size': page_size,
        'num_pages': paginator.num_pages,
        'results': serializer.data,
    }