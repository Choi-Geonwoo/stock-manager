from datetime import datetime

class DateTimeUtil:
    @staticmethod
    def datetime_to_str(dt: datetime, fmt: str = "%Y%m%d_%H%M%S_%f") -> str:
        return dt.strftime(fmt)

    @classmethod
    def generate_custom_key(cls) -> str:
        return cls.datetime_to_str(datetime.now())