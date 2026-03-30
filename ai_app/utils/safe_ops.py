ALLOWED_OPS = {"max", "mean", "sum", "trend", "describe"}


def validate_op(op: str):
    if op not in ALLOWED_OPS:
        raise ValueError(f"Operation {op} not allowed")