# utils.py
def clean_filter(value):
    """값이 '0'이거나 None이면 빈 문자열로 반환, 아니면 원래 값 반환"""
    if value == "0" or value is None:
        return ""
    return str(value)