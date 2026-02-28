"""
The Mimo Python runtime.
Provides Python implementations for Mimo's built-ins and standard library.
"""
import os
import sys
import re
import json
import math
import random
import datetime
import urllib.request
import urllib.error
from pathlib import Path
from typing import Any, List, Dict, Callable, Optional, Union


def is_equal(a: Any, b: Any) -> bool:
    """Deep equality check for Mimo values."""
    if a is b:
        return True
    if type(a) != type(b):
        return False
    if isinstance(a, (list, tuple)):
        if len(a) != len(b):
            return False
        return all(is_equal(x, y) for x, y in zip(a, b))
    if isinstance(a, dict):
        if set(a.keys()) != set(b.keys()):
            return False
        return all(is_equal(a[k], b[k]) for k in a.keys())
    return a == b


def stringify(value: Any) -> str:
    """Convert a value to Mimo's string representation."""
    if value is None:
        return 'null'
    if isinstance(value, bool):
        return 'true' if value else 'false'
    if isinstance(value, str):
        return value
    if isinstance(value, (list, tuple)):
        elements = [stringify(v) for v in value]
        return f"[{', '.join(elements)}]"
    if isinstance(value, dict):
        pairs = [f"{k}: {stringify(v)}" for k, v in value.items()]
        return f"{{{', '.join(pairs)}}}"
    if isinstance(value, datetime.datetime):
        return f"datetime({value.isoformat()})"
    return str(value)


class MimoRuntime:
    """Main Mimo runtime class containing all built-ins and standard library modules."""

    def __init__(self):
        self.setup_stdlib()

    # --- Core IO & Utils ---
    def show(self, *args):
        """Print values to stdout."""
        output = ' '.join(stringify(arg) for arg in args)
        print(output)

    # --- Core Built-ins ---
    def len(self, collection):
        """Get length of a collection."""
        if collection is None:
            return 0
        if hasattr(collection, '__len__'):
            return len(collection)
        if isinstance(collection, dict):
            return len(collection.keys())
        return 0

    def add(self, a, b):
        """Mimo + operator: concatenates if either operand is a string, otherwise adds."""
        if isinstance(a, str) or isinstance(b, str):
            return stringify(a) + stringify(b)
        return a + b

    def get(self, collection, key):
        """Get value from collection by key, return None if not found."""
        if collection is None:
            return None
        try:
            if isinstance(collection, (list, tuple)):
                return collection[key] if 0 <= key < len(collection) else None
            elif isinstance(collection, dict):
                return collection.get(key)
            else:
                return getattr(collection, key, None)
        except (KeyError, IndexError, TypeError):
            return None

    def update(self, collection, key, value):
        """Update collection at key with value."""
        if isinstance(collection, list) and isinstance(key, int):
            if 0 <= key < len(collection):
                collection[key] = value
        elif isinstance(collection, dict):
            collection[key] = value
        else:
            setattr(collection, key, value)
        return value

    def type(self, value):
        """Get Mimo type of value."""
        if value is None:
            return 'null'
        elif isinstance(value, bool):
            return 'boolean'
        elif isinstance(value, (int, float)):
            return 'number'
        elif isinstance(value, str):
            return 'string'
        elif isinstance(value, (list, tuple)):
            return 'array'
        elif isinstance(value, dict):
            return 'object'
        elif callable(value):
            return 'function'
        else:
            return 'object'

    def push(self, array, value):
        """Add value to end of array."""
        if isinstance(array, list):
            array.append(value)
        return array

    def pop(self, array):
        """Remove and return last element from array."""
        if isinstance(array, list) and len(array) > 0:
            return array.pop()
        return None

    def range(self, *args):
        """Generate range of numbers."""
        if len(args) == 1:
            return list(range(args[0]))
        elif len(args) == 2:
            return list(range(args[0], args[1]))
        elif len(args) == 3:
            return list(range(args[0], args[1], args[2]))
        else:
            return []

    def join(self, array, separator):
        """Join array elements with separator."""
        if not isinstance(array, (list, tuple)):
            return ""
        return separator.join(stringify(item) for item in array)

    def slice(self, collection, start, end=None):
        """Slice a collection."""
        if end is None:
            return collection[start:]
        return collection[start:end]

    # --- Logical Operators ---
    def eq(self, a, b):
        return is_equal(a, b)

    def neq(self, a, b):
        return not is_equal(a, b)

    def and_(self, a, b):
        return a and b

    def or_(self, a, b):
        return a or b

    # --- Utility functions ---
    def has_property(self, obj, prop):
        if isinstance(obj, dict):
            return prop in obj
        else:
            return hasattr(obj, prop)

    def get_property_safe(self, obj, prop):
        """Safely get a property, returning None if not found."""
        return self.get(obj, prop)

    def keys(self, obj):
        if isinstance(obj, dict):
            return list(obj.keys())
        return []

    def values(self, obj):
        if isinstance(obj, dict):
            return list(obj.values())
        return []

    def entries(self, obj):
        if isinstance(obj, dict):
            return [[k, v] for k, v in obj.items()]
        return []

    def get_arguments(self):
        return sys.argv[1:]

    def get_env(self, name):
        return os.environ.get(name)

    def coalesce(self, *args):
        """Return first non-None value."""
        for arg in args:
            if arg is not None:
                return arg
        return None

    def if_else(self, condition, then_val, else_val):
        """Ternary if_else built-in."""
        return then_val if condition else else_val

    def exit_code(self, code=0):
        """Exit the program with the given code."""
        sys.exit(code)

    def setup_stdlib(self):
        """Setup standard library modules."""

        # File system module
        class FSModule:
            @staticmethod
            def read_file(path: str) -> str:
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        return f.read()
                except Exception as e:
                    raise Exception(f"Failed to read file {path}: {str(e)}")

            @staticmethod
            def write_file(path: str, data: str) -> None:
                try:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(data)
                except Exception as e:
                    raise Exception(f"Failed to write file {path}: {str(e)}")

            @staticmethod
            def exists(path: str) -> bool:
                return Path(path).exists()

            @staticmethod
            def list_dir(path: str) -> List[str]:
                try:
                    return list(os.listdir(path))
                except Exception as e:
                    raise Exception(f"Failed to list directory {path}: {str(e)}")

            @staticmethod
            def make_dir(path: str, recursive: bool = False) -> None:
                try:
                    if recursive:
                        Path(path).mkdir(parents=True, exist_ok=True)
                    else:
                        Path(path).mkdir(exist_ok=True)
                except Exception as e:
                    raise Exception(f"Failed to create directory {path}: {str(e)}")

            @staticmethod
            def remove_file(path: str) -> None:
                try:
                    Path(path).unlink()
                except Exception as e:
                    raise Exception(f"Failed to remove file {path}: {str(e)}")

            @staticmethod
            def remove_dir(path: str) -> None:
                try:
                    Path(path).rmdir()
                except Exception as e:
                    raise Exception(f"Failed to remove directory {path}: {str(e)}")

        # JSON module
        class JSONModule:
            @staticmethod
            def parse(text: str):
                try:
                    return json.loads(text)
                except json.JSONDecodeError as e:
                    raise Exception(f"Failed to parse JSON: {str(e)}")

            @staticmethod
            def stringify(obj, indent: Optional[int] = None):
                try:
                    return json.dumps(obj, indent=indent, ensure_ascii=False)
                except Exception as e:
                    raise Exception(f"Failed to stringify JSON: {str(e)}")

        # DateTime module
        class DateTimeModule:
            @staticmethod
            def now():
                return datetime.datetime.now()

            @staticmethod
            def get_timestamp(dt):
                if isinstance(dt, datetime.datetime):
                    return int(dt.timestamp() * 1000)
                return 0

            @staticmethod
            def from_timestamp(ts):
                return datetime.datetime.fromtimestamp(ts / 1000)

            @staticmethod
            def to_iso_string(dt):
                if isinstance(dt, datetime.datetime):
                    return dt.isoformat()
                return ""

            @staticmethod
            def format(dt, fmt):
                if not isinstance(dt, datetime.datetime):
                    return ""
                result = fmt
                result = result.replace('YYYY', str(dt.year))
                result = result.replace('MM', f"{dt.month:02d}")
                result = result.replace('DD', f"{dt.day:02d}")
                result = result.replace('hh', f"{dt.hour:02d}")
                result = result.replace('mm', f"{dt.minute:02d}")
                result = result.replace('ss', f"{dt.second:02d}")
                return result

        # Math module
        class MathModule:
            PI = math.pi
            E = math.e

            def __getattr__(self, name):
                if hasattr(math, name):
                    return getattr(math, name)
                raise AttributeError(f"Math module has no attribute '{name}'")

        # String module
        class StringModule:
            @staticmethod
            def to_upper(s: str) -> str:
                return s.upper()

            @staticmethod
            def to_lower(s: str) -> str:
                return s.lower()

            @staticmethod
            def to_title_case(s: str) -> str:
                return ' '.join(w.capitalize() for w in s.lower().split(' '))

            @staticmethod
            def capitalize(s: str) -> str:
                return s[0].upper() + s[1:] if s else s

            @staticmethod
            def trim(s: str) -> str:
                return s.strip()

            @staticmethod
            def trim_start(s: str) -> str:
                return s.lstrip()

            @staticmethod
            def trim_end(s: str) -> str:
                return s.rstrip()

            @staticmethod
            def pad_start(s: str, length: int, pad: str = ' ') -> str:
                return s.rjust(length, pad)

            @staticmethod
            def pad_end(s: str, length: int, pad: str = ' ') -> str:
                return s.ljust(length, pad)

            @staticmethod
            def contains(s: str, sub: str, pos: int = 0) -> bool:
                return sub in s[pos:]

            @staticmethod
            def starts_with(s: str, sub: str, pos: int = 0) -> bool:
                return s.startswith(sub, pos)

            @staticmethod
            def ends_with(s: str, sub: str, end: Optional[int] = None) -> bool:
                return s.endswith(sub, 0, end)

            @staticmethod
            def index_of(s: str, sub: str, from_idx: int = 0) -> int:
                try:
                    return s.index(sub, from_idx)
                except ValueError:
                    return -1

            @staticmethod
            def last_index_of(s: str, sub: str, from_idx: Optional[int] = None) -> int:
                try:
                    if from_idx is not None:
                        return s.rindex(sub, 0, from_idx + 1)
                    return s.rindex(sub)
                except ValueError:
                    return -1

            @staticmethod
            def substring(s: str, start: int, end: Optional[int] = None) -> str:
                return s[start:end]

            @staticmethod
            def slice(s: str, start: int, end: Optional[int] = None) -> str:
                return s[start:end]

            @staticmethod
            def split(s: str, sep=None, limit: Optional[int] = None) -> List[str]:
                if limit is not None:
                    return s.split(sep, limit)
                return s.split(sep)

            @staticmethod
            def replace(s: str, find: str, rep: str) -> str:
                return s.replace(find, rep, 1)

            @staticmethod
            def replace_all(s: str, find: str, rep: str) -> str:
                return s.replace(find, rep)

            @staticmethod
            def repeat(s: str, n: int) -> str:
                return s * n

            @staticmethod
            def char_at(s: str, i: int) -> str:
                return s[i] if 0 <= i < len(s) else ''

            @staticmethod
            def is_empty(s: str) -> bool:
                return len(s) == 0

            @staticmethod
            def is_blank(s: str) -> bool:
                return len(s.strip()) == 0

        # Array module
        class ArrayModule:
            @staticmethod
            def map(array: List, callback: Callable) -> List:
                return [callback(item) for item in array]

            @staticmethod
            def filter(array: List, callback: Callable) -> List:
                return [item for item in array if callback(item)]

            @staticmethod
            def reduce(array: List, callback: Callable, initial=None):
                if initial is not None:
                    result = initial
                    start = 0
                else:
                    result = array[0] if array else None
                    start = 1
                for i in range(start, len(array)):
                    result = callback(result, array[i])
                return result

            @staticmethod
            def flat(array: List, depth: int = 1) -> List:
                def _flat(arr, d):
                    result = []
                    for item in arr:
                        if isinstance(item, list) and d > 0:
                            result.extend(_flat(item, d - 1))
                        else:
                            result.append(item)
                    return result
                return _flat(array, depth)

            @staticmethod
            def flat_map(array: List, callback: Callable) -> List:
                result = []
                for item in array:
                    mapped = callback(item)
                    if isinstance(mapped, list):
                        result.extend(mapped)
                    else:
                        result.append(mapped)
                return result

            @staticmethod
            def group_by(array: List, callback: Callable) -> Dict:
                result = {}
                for item in array:
                    key = str(callback(item))
                    if key not in result:
                        result[key] = []
                    result[key].append(item)
                return result

            @staticmethod
            def zip(*arrays) -> List:
                return [list(group) for group in zip(*arrays)]

            @staticmethod
            def chunk(array: List, size: int) -> List:
                return [array[i:i + size] for i in range(0, len(array), size)]

            @staticmethod
            def count(array: List, callback: Optional[Callable] = None) -> int:
                if callback:
                    return sum(1 for item in array if callback(item))
                return len(array)

            @staticmethod
            def for_each(array: List, callback: Callable) -> None:
                for item in array:
                    callback(item)

            @staticmethod
            def find(array: List, callback: Callable):
                for item in array:
                    if callback(item):
                        return item
                return None

            @staticmethod
            def find_index(array: List, callback: Callable) -> int:
                for i, item in enumerate(array):
                    if callback(item):
                        return i
                return -1

            @staticmethod
            def includes(array: List, value) -> bool:
                return value in array

            @staticmethod
            def index_of(array: List, value, from_idx: int = 0) -> int:
                try:
                    return array.index(value, from_idx)
                except ValueError:
                    return -1

            @staticmethod
            def last_index_of(array: List, value, from_idx: Optional[int] = None) -> int:
                search = array[:from_idx + 1] if from_idx is not None else array
                for i in range(len(search) - 1, -1, -1):
                    if search[i] == value:
                        return i
                return -1

            @staticmethod
            def slice(array: List, start: int, end: Optional[int] = None) -> List:
                return array[start:end]

            @staticmethod
            def first(array: List):
                return array[0] if array else None

            @staticmethod
            def last(array: List):
                return array[-1] if array else None

            @staticmethod
            def is_empty(array: List) -> bool:
                return len(array) == 0

            @staticmethod
            def sort(array: List, callback: Optional[Callable] = None) -> List:
                if callback:
                    import functools
                    return sorted(array, key=functools.cmp_to_key(callback))
                return sorted(array)

            @staticmethod
            def reverse(array: List) -> List:
                return list(reversed(array))

            @staticmethod
            def shuffle(array: List) -> List:
                result = list(array)
                random.shuffle(result)
                return result

            @staticmethod
            def concat(*arrays) -> List:
                result = []
                for arr in arrays:
                    result.extend(arr)
                return result

            @staticmethod
            def unique(array: List) -> List:
                seen = []
                result = []
                for item in array:
                    if item not in seen:
                        seen.append(item)
                        result.append(item)
                return result

            @staticmethod
            def intersection(a: List, b: List) -> List:
                return [v for v in a if v in b]

            @staticmethod
            def union(a: List, b: List) -> List:
                result = list(a)
                for item in b:
                    if item not in result:
                        result.append(item)
                return result

            @staticmethod
            def difference(a: List, b: List) -> List:
                return [v for v in a if v not in b]

        # Path module
        class PathModule:
            @staticmethod
            def join(*parts: str) -> str:
                return os.path.join(*parts)

            @staticmethod
            def dirname(p: str) -> str:
                return os.path.dirname(p)

            @staticmethod
            def basename(p: str, ext: Optional[str] = None) -> str:
                base = os.path.basename(p)
                if ext and base.endswith(ext):
                    base = base[:-len(ext)]
                return base

            @staticmethod
            def extname(p: str) -> str:
                return os.path.splitext(p)[1]

        # Env module
        class EnvModule:
            @staticmethod
            def get(name: str, fallback=None):
                return os.environ.get(name, fallback)

            @staticmethod
            def has(name: str) -> bool:
                return name in os.environ

            @staticmethod
            def all() -> Dict[str, str]:
                return dict(os.environ)

        # Regex module
        class RegexModule:
            @staticmethod
            def find_matches(pattern: str, text: str, flags: str = '') -> Optional[List[str]]:
                flag_map = {'i': re.IGNORECASE, 'm': re.MULTILINE, 's': re.DOTALL}
                re_flags = 0
                for ch in flags.replace('g', ''):
                    re_flags |= flag_map.get(ch, 0)
                matches = re.findall(pattern, text, re_flags)
                return matches if matches else None

            @staticmethod
            def is_match(pattern: str, text: str, flags: str = '') -> bool:
                flag_map = {'i': re.IGNORECASE, 'm': re.MULTILINE, 's': re.DOTALL}
                re_flags = 0
                for ch in flags:
                    re_flags |= flag_map.get(ch, 0)
                return bool(re.search(pattern, text, re_flags))

            @staticmethod
            def replace_all(text: str, pattern: str, replacement: str, flags: str = '') -> str:
                flag_map = {'i': re.IGNORECASE, 'm': re.MULTILINE, 's': re.DOTALL}
                re_flags = 0
                for ch in flags.replace('g', ''):
                    re_flags |= flag_map.get(ch, 0)
                return re.sub(pattern, replacement, text, flags=re_flags)

            @staticmethod
            def extract(pattern: str, text: str, flags: str = '') -> Optional[List[str]]:
                flag_map = {'i': re.IGNORECASE, 'm': re.MULTILINE, 's': re.DOTALL}
                re_flags = 0
                for ch in flags:
                    re_flags |= flag_map.get(ch, 0)
                m = re.search(pattern, text, re_flags)
                if m is None:
                    return None
                return [m.group(0)] + list(m.groups())

        # HTTP module
        class HTTPModule:
            @staticmethod
            def get(url: str) -> str:
                try:
                    with urllib.request.urlopen(url) as response:
                        return response.read().decode('utf-8')
                except urllib.error.URLError as e:
                    raise Exception(f"HTTP GET request failed: {str(e)}")

            @staticmethod
            def post(url: str, body: str, headers: Optional[Dict] = None) -> str:
                req_headers = {'Content-Type': 'application/json'}
                if headers:
                    req_headers.update(headers)
                data = body.encode('utf-8')
                req = urllib.request.Request(url, data=data, headers=req_headers, method='POST')
                try:
                    with urllib.request.urlopen(req) as response:
                        return response.read().decode('utf-8')
                except urllib.error.URLError as e:
                    raise Exception(f"HTTP POST request failed: {str(e)}")

        # Object module
        class ObjectModule:
            @staticmethod
            def merge(*objs: Dict) -> Dict:
                result = {}
                for obj in objs:
                    result.update(obj)
                return result

            @staticmethod
            def pick(obj: Dict, keys: List[str]) -> Dict:
                return {k: obj[k] for k in keys if k in obj}

            @staticmethod
            def omit(obj: Dict, keys: List[str]) -> Dict:
                excluded = set(keys)
                return {k: v for k, v in obj.items() if k not in excluded}

            @staticmethod
            def map_values(obj: Dict, callback: Callable) -> Dict:
                return {k: callback(v, k, obj) for k, v in obj.items()}

            @staticmethod
            def from_entries(entries: List) -> Dict:
                return {str(entry[0]): entry[1] for entry in entries}

            @staticmethod
            def is_empty(obj: Dict) -> bool:
                return len(obj) == 0

            @staticmethod
            def keys(obj: Dict) -> List[str]:
                return list(obj.keys())

            @staticmethod
            def values(obj: Dict) -> List:
                return list(obj.values())

            @staticmethod
            def entries(obj: Dict) -> List:
                return [[k, v] for k, v in obj.items()]

        # Assert module
        class AssertModule:
            @staticmethod
            def eq(actual, expected, message: Optional[str] = None) -> bool:
                if not is_equal(actual, expected):
                    msg = f": {message}" if message else ""
                    raise AssertionError(
                        f"Assertion Failed{msg}.\n   Expected: {json.dumps(expected)}\n   Actual:   {json.dumps(actual)}"
                    )
                return True

            @staticmethod
            def neq(actual, expected, message: Optional[str] = None) -> bool:
                if is_equal(actual, expected):
                    msg = f": {message}" if message else ""
                    raise AssertionError(f"Assertion Failed{msg}. Expected values to be different.")
                return True

            @staticmethod
            def true(condition, message: Optional[str] = None) -> bool:
                if condition is not True:
                    msg = f": {message}" if message else ""
                    raise AssertionError(f"Assertion Failed{msg}. Expected true, got {condition!r}")
                return True

            @staticmethod
            def false(condition, message: Optional[str] = None) -> bool:
                if condition is not False:
                    msg = f": {message}" if message else ""
                    raise AssertionError(f"Assertion Failed{msg}. Expected false, got {condition!r}")
                return True

            @staticmethod
            def throws(fn: Callable, message: Optional[str] = None) -> bool:
                try:
                    fn()
                except Exception:
                    return True
                msg = f": {message}" if message else ""
                raise AssertionError(f"Assertion Failed{msg}. Expected function to throw, but it did not.")

        # Assign all modules
        self.fs = FSModule()
        self.json = JSONModule()
        self.datetime = DateTimeModule()
        self.math = MathModule()
        self.string = StringModule()
        self.array = ArrayModule()
        self.path = PathModule()
        self.env = EnvModule()
        self.regex = RegexModule()
        self.http = HTTPModule()
        self.object = ObjectModule()
        self.assert_ = AssertModule()


# Create global mimo instance
mimo = MimoRuntime()
