def is_valid(s: str) -> bool:
    matching = {')': '(', ']': '[', '}': '{'}
    opened: list[str] = []

    for char in s:
        if char in matching:
            if not opened or opened.pop() != matching[char]:
                return False
        else:
            opened.append(char)

    return not opened
