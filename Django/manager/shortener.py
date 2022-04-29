from math import floor
import string

DEFAULT_BASE = string.ascii_lowercase + string.digits

# encode any base10 number to base len(base) number
def encode_num(num, base = None):
    if base is None:
        base = DEFAULT_BASE
    b = len(base)
    if b <= 0 or b > 62:
        return 0

    r = num % b
    res = base[r];
    q = floor(num / b)
    while q:
        r = q % b
        q = floor(q / b)
        res = base[int(r)] + res
    return res

# decode any base len(base) number to base10 number
def decode_num(num, base = None):
    if base is None:
        base = DEFAULT_BASE
    b = len(base)

    res = 0
    for c in num:
        res = b * res + base.find(c)
    return res
