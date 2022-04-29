from django import template

register = template.Library()


class AppendGetNode(template.Node):
    def __init__(self, token):
        self.dict_pairs = {}

        tokens = token.split_contents()
        if len(tokens) <= 1:
            return

        for t in tokens[1:]:
            k, v = t.split('=')
            if k != '_url':
                self.dict_pairs[k] = template.Variable(v)

    def render(self, context):
        request = context['request']
        path = request.path
        query = request.GET.copy()

        for key, value in self.dict_pairs.items():
            try:
                value_instance = value.resolve(context)
                if key == '_url':
                    path = value_instance
                else:
                    query[key] = value_instance
            except:
                #print('Cannot resolve=', key, value)
                pass

        if query:
            path += "?%s" % query.urlencode()

        return path


@register.tag(name='url_extend')
def url_extend(parser, token):
    return AppendGetNode(token)
