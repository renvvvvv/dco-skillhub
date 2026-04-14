#!/usr/bin/env python3
"""测试提取 skill.md"""

import sys
sys.path.insert(0, '/app')

from app.services import extract_skill_md
from pathlib import Path
import traceback

try:
    result = extract_skill_md(Path("/tmp/test.zip"))
    print(f"Name: {result['name']}")
    print(f"Desc: {result['description'][:50]}...")
except Exception as e:
    print(f"Error: {e}")
    traceback.print_exc()
