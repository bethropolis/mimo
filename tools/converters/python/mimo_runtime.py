"""
The Mimo Python runtime.
Provides Python implementations for Mimo's built-ins and standard library.
"""
import os
import sys
import json
import math
import datetime
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
        elif isinstance(value, int):
            return 'number'
        elif isinstance(value, float):
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
        """Test equality."""
        return is_equal(a, b)
    
    def neq(self, a, b):
        """Test inequality."""
        return not is_equal(a, b)
    
    def and_(self, a, b):
        """Logical AND."""
        return a and b
    
    def or_(self, a, b):
        """Logical OR."""
        return a or b
    
    # --- Utility functions ---
    def has_property(self, obj, prop):
        """Check if object has property."""
        if isinstance(obj, dict):
            return prop in obj
        else:
            return hasattr(obj, prop)
    
    def keys(self, obj):
        """Get keys of object."""
        if isinstance(obj, dict):
            return list(obj.keys())
        return []
    
    def values(self, obj):
        """Get values of object."""
        if isinstance(obj, dict):
            return list(obj.values())
        return []
    
    def entries(self, obj):
        """Get key-value pairs of object."""
        if isinstance(obj, dict):
            return [[k, v] for k, v in obj.items()]
        return []
    
    def setup_stdlib(self):
        """Setup standard library modules."""
        
        # File system module
        class FSModule:
            @staticmethod
            def read_file(path: str) -> str:
                """Read file contents as string."""
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        return f.read()
                except Exception as e:
                    raise Exception(f"Failed to read file {path}: {str(e)}")
            
            @staticmethod
            def write_file(path: str, data: str) -> None:
                """Write string to file."""
                try:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(data)
                except Exception as e:
                    raise Exception(f"Failed to write file {path}: {str(e)}")
            
            @staticmethod
            def exists(path: str) -> bool:
                """Check if path exists."""
                return Path(path).exists()
            
            @staticmethod
            def list_dir(path: str) -> List[str]:
                """List directory contents."""
                try:
                    return list(os.listdir(path))
                except Exception as e:
                    raise Exception(f"Failed to list directory {path}: {str(e)}")
            
            @staticmethod
            def make_dir(path: str, recursive: bool = False) -> None:
                """Create directory."""
                try:
                    if recursive:
                        Path(path).mkdir(parents=True, exist_ok=True)
                    else:
                        Path(path).mkdir(exist_ok=True)
                except Exception as e:
                    raise Exception(f"Failed to create directory {path}: {str(e)}")
            
            @staticmethod
            def remove_file(path: str) -> None:
                """Remove file."""
                try:
                    Path(path).unlink()
                except Exception as e:
                    raise Exception(f"Failed to remove file {path}: {str(e)}")
            
            @staticmethod
            def remove_dir(path: str) -> None:
                """Remove directory."""
                try:
                    Path(path).rmdir()
                except Exception as e:
                    raise Exception(f"Failed to remove directory {path}: {str(e)}")
        
        # JSON module
        class JSONModule:
            @staticmethod
            def parse(text: str):
                """Parse JSON string."""
                try:
                    return json.loads(text)
                except json.JSONDecodeError as e:
                    raise Exception(f"Failed to parse JSON: {str(e)}")
            
            @staticmethod
            def stringify(obj, indent: Optional[int] = None):
                """Convert object to JSON string."""
                try:
                    return json.dumps(obj, indent=indent, ensure_ascii=False)
                except Exception as e:
                    raise Exception(f"Failed to stringify JSON: {str(e)}")
        
        # DateTime module
        class DateTimeModule:
            @staticmethod
            def now():
                """Get current datetime."""
                return datetime.datetime.now()
            
            @staticmethod
            def get_timestamp(dt):
                """Get timestamp from datetime."""
                if isinstance(dt, datetime.datetime):
                    return int(dt.timestamp() * 1000)
                return 0
            
            @staticmethod
            def from_timestamp(ts):
                """Create datetime from timestamp."""
                return datetime.datetime.fromtimestamp(ts / 1000)
            
            @staticmethod
            def to_iso_string(dt):
                """Convert datetime to ISO string."""
                if isinstance(dt, datetime.datetime):
                    return dt.isoformat()
                return ""
            
            @staticmethod
            def format(dt, fmt):
                """Format datetime with pattern."""
                if not isinstance(dt, datetime.datetime):
                    return ""
                
                # Simple format mapping
                result = fmt
                result = result.replace('YYYY', str(dt.year))
                result = result.replace('MM', f"{dt.month:02d}")
                result = result.replace('DD', f"{dt.day:02d}")
                result = result.replace('hh', f"{dt.hour:02d}")
                result = result.replace('mm', f"{dt.minute:02d}")
                result = result.replace('ss', f"{dt.second:02d}")
                return result
        
        # Math module (use Python's math module)
        class MathModule:
            def __getattr__(self, name):
                if hasattr(math, name):
                    return getattr(math, name)
                raise AttributeError(f"Math module has no attribute '{name}'")
            
            # Add constants
            PI = math.pi
            E = math.e
        
        # String module
        class StringModule:
            @staticmethod
            def to_upper(s: str) -> str:
                return s.upper()
            
            @staticmethod
            def to_lower(s: str) -> str:
                return s.lower()
            
            @staticmethod
            def trim(s: str) -> str:
                return s.strip()
            
            @staticmethod
            def split(s: str, sep: str) -> List[str]:
                return s.split(sep)
            
            @staticmethod
            def contains(s: str, sub: str) -> bool:
                return sub in s
            
            @staticmethod
            def starts_with(s: str, sub: str) -> bool:
                return s.startswith(sub)
            
            @staticmethod
            def ends_with(s: str, sub: str) -> bool:
                return s.endswith(sub)
            
            @staticmethod
            def replace(s: str, find: str, replace: str) -> str:
                return s.replace(find, replace, 1)
            
            @staticmethod
            def replace_all(s: str, find: str, replace: str) -> str:
                return s.replace(find, replace)
        
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
            def slice(array: List, start: int, end: Optional[int] = None) -> List:
                return array[start:end]
            
            @staticmethod
            def sort(array: List) -> List:
                return sorted(array)
            
            @staticmethod
            def reverse(array: List) -> List:
                return list(reversed(array))
            
            @staticmethod
            def concat(*arrays) -> List:
                result = []
                for arr in arrays:
                    result.extend(arr)
                return result
            
            @staticmethod
            def includes(array: List, value) -> bool:
                return value in array
        
        # Assign modules
        self.fs = FSModule()
        self.json = JSONModule()
        self.datetime = DateTimeModule()
        self.math = MathModule()
        self.string = StringModule()
        self.array = ArrayModule()


# Create global mimo instance
mimo = MimoRuntime()
