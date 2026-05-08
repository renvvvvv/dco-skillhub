"""业务逻辑服务"""
import hashlib
import zipfile
import tarfile
import re
import shutil
import io
import subprocess
import tempfile
import os
from pathlib import Path
from datetime import datetime
from typing import List, Optional
from app.config import STORAGE_DIR

# 尝试导入 py7zr，未安装则跳过
try:
    import py7zr
    HAS_PY7ZR = True
except ImportError:
    HAS_PY7ZR = False

# RAR 支持：使用系统 unrar-free 命令（Docker 已安装）
def _has_unrar() -> bool:
    return shutil.which('unrar-free') is not None or shutil.which('unrar') is not None

def _get_unrar_cmd() -> str:
    if shutil.which('unrar-free'):
        return 'unrar-free'
    if shutil.which('unrar'):
        return 'unrar'
    return ''
from app.database import skills_db, versions_db, search_db


def hash_admin_key(key: str) -> str:
    """管理员密钥哈希"""
    return hashlib.sha256(key.encode()).hexdigest()


def verify_admin_key(skill_id: str, provided_key: str) -> bool:
    """验证管理员密钥"""
    data = skills_db.read()
    skill = next(
        (s for s in data.get("skills", []) if s["id"] == skill_id),
        None
    )
    if not skill:
        return False
    return skill.get("admin_key_hash") == hash_admin_key(provided_key)


def _parse_skill_md(content: str) -> dict:
    """解析 skill.md 内容"""
    content = content.lstrip('\ufeff')
    name = None
    description = None
    readme_content = content
    lines = content.split('\n')
    
    if lines and lines[0].strip() == '---':
        end_idx = -1
        yaml_lines = []
        for i, line in enumerate(lines[1:], start=1):
            if line.strip() == '---':
                end_idx = i
                break
            yaml_lines.append(line)
        
        if end_idx > 0:
            for line in yaml_lines:
                if ':' in line:
                    key, value = line.split(':', 1)
                    key = key.strip()
                    value = value.strip().strip('"').strip("'")
                    if key == 'name':
                        name = value
                    elif key == 'description':
                        description = value
            readme_lines = lines[end_idx + 1:]
            readme_content = '\n'.join(readme_lines).strip()
    
    if not name:
        name = lines[0].lstrip('#').strip() if lines else "Unknown"
    if not description:
        description = '\n'.join(lines[1:]).strip() if len(lines) > 1 else ""
    description = description[:200]
    if not name or name == '---':
        name = "Unnamed Skill"
    
    return {
        "name": name,
        "description": description,
        "readme_content": readme_content or content
    }


def _find_skill_md_in_list(names: list) -> str:
    """从文件列表中查找 skill.md"""
    for name in names:
        if name.lower().endswith('skill.md'):
            return name
    return ""


def extract_skill_md(archive_path: Path) -> dict:
    """从压缩包中提取并解析 skill.md，支持 zip/tar.gz/7z"""
    content = None
    suffix = archive_path.suffix.lower()
    name_lower = archive_path.name.lower()
    
    # ZIP
    if suffix == '.zip' or zipfile.is_zipfile(archive_path):
        with zipfile.ZipFile(archive_path, 'r') as zf:
            md_file = _find_skill_md_in_list(zf.namelist())
            if not md_file:
                raise ValueError("压缩包中未找到 skill.md 文件")
            content = zf.read(md_file).decode('utf-8')
    
    # TAR.GZ / TAR.BZ2 / TAR.XZ
    elif suffix in ('.gz', '.bz2', '.xz', '.tar') or tarfile.is_tarfile(archive_path):
        with tarfile.open(archive_path, 'r:*') as tf:
            md_file = _find_skill_md_in_list(tf.getnames())
            if not md_file:
                raise ValueError("压缩包中未找到 skill.md 文件")
            member = tf.getmember(md_file)
            f = tf.extractfile(member)
            if f:
                content = f.read().decode('utf-8')
    
    # 7Z
    elif suffix == '.7z' and HAS_PY7ZR:
        with py7zr.SevenZipFile(archive_path, 'r') as zf:
            names = zf.getnames()
            md_file = _find_skill_md_in_list(names)
            if not md_file:
                raise ValueError("压缩包中未找到 skill.md 文件")
            data = zf.read([md_file])
            if md_file in data:
                content = data[md_file].read().decode('utf-8')
    
    # RAR - 使用系统 unrar-free/unrar 命令
    elif suffix == '.rar' and _has_unrar():
        with tempfile.TemporaryDirectory() as tmpdir:
            cmd = _get_unrar_cmd()
            # 解压所有文件到临时目录
            # unrar-free: -x 解压, -f 覆盖, 目标目录在最后
            # unrar-nonfree: x 解压, 目标目录在最后
            extract_result = subprocess.run(
                [cmd, '-x', '-f', str(archive_path), tmpdir],
                capture_output=True, text=True
            )
            # 在临时目录中查找 skill.md
            md_file = None
            for root, dirs, files in os.walk(tmpdir):
                for f in files:
                    if f.lower().endswith('skill.md'):
                        md_file = os.path.join(root, f)
                        break
                if md_file:
                    break
            if not md_file:
                raise ValueError("压缩包中未找到 skill.md 文件")
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()
    
    if content is None:
        raise ValueError("不支持的压缩包格式，请使用 zip/tar.gz/7z/rar")
    
    return _parse_skill_md(content)


def generate_slug(name: str) -> str:
    """生成 URL 友好的 slug"""
    # 转小写，替换空格为 -，移除特殊字符
    slug = name.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')


def update_search_index(skill: dict):
    """更新搜索索引（含作者、部门、标签信息）"""
    def updater(data):
        index = data.get("index", {})
        
        # 提取关键词（中英文分词）
        # 包含：名称、描述、作者名、作者部门、作者组织、标签
        text = f"{skill.get('name', '')} {skill.get('description', '')}"
        author_name = skill.get('author_name', '')
        author_department = skill.get('author_department', '')
        author_organization = skill.get('author_organization', '')
        tags = ' '.join(skill.get('tags', []))
        
        # 构建完整搜索文本
        full_text = f"{text} {author_name} {author_department} {author_organization} {tags}"
        
        words = set()
        
        # 英文按空格分词
        for word in full_text.lower().split():
            words.add(word)
            # 添加子串（前缀匹配）
            for i in range(2, len(word) + 1):
                words.add(word[:i])
        
        # 中文按字符分词
        for char in full_text:
            if '\u4e00' <= char <= '\u9fff':  # 中文字符
                words.add(char)
        
        # 单独添加作者名、部门、标签的完整词（支持精确搜索）
        for field in [author_name, author_department, author_organization, tags]:
            if field:
                words.add(field.lower())
                # 中文短语拆分
                for i in range(len(field)):
                    for j in range(i + 2, min(i + 10, len(field) + 1)):
                        words.add(field[i:j].lower())
        
        # 更新索引
        skill_id = skill["id"]
        for word in words:
            if not word.strip():
                continue
            if word not in index:
                index[word] = []
            if skill_id not in index[word]:
                index[word].append(skill_id)
        
        data["index"] = index
    
    search_db.update(updater)


def search_skills(query: str, filter_author: str = None, filter_department: str = None, filter_tag: str = None) -> List[dict]:
    """搜索技能（支持按作者、部门、标签筛选）
    
    Args:
        query: 搜索关键词（匹配名称、描述、作者、部门）
        filter_author: 按作者名筛选（精确匹配）
        filter_department: 按部门筛选（精确匹配）
        filter_tag: 按标签筛选（精确匹配）
    """
    if not query.strip() and not filter_author and not filter_department and not filter_tag:
        return []
    
    # 读取数据
    skills_data = skills_db.read()
    search_data = search_db.read()
    
    skills = {s["id"]: s for s in skills_data.get("skills", [])}
    index = search_data.get("index", {})
    
    matched_ids = set(skills.keys())
    
    # 关键词搜索
    if query.strip():
        query_words = query.lower().split()
        word_matched = set()
        
        for word in query_words:
            # 精确匹配
            if word in index:
                word_matched.update(index[word])
            
            # 前缀匹配
            for key, ids in index.items():
                if key.startswith(word):
                    word_matched.update(ids)
        
        matched_ids = matched_ids & word_matched if word_matched else matched_ids
    
    # 作者筛选
    if filter_author:
        author_matched = {
            sid for sid, s in skills.items()
            if filter_author.lower() in s.get("author_name", "").lower()
        }
        matched_ids = matched_ids & author_matched
    
    # 部门筛选
    if filter_department:
        dept_matched = {
            sid for sid, s in skills.items()
            if filter_department.lower() in s.get("author_department", "").lower()
        }
        matched_ids = matched_ids & dept_matched
    
    # 标签筛选
    if filter_tag:
        tag_matched = {
            sid for sid, s in skills.items()
            if any(filter_tag.lower() in t.lower() for t in s.get("tags", []))
        }
        matched_ids = matched_ids & tag_matched
    
    # 按下载量排序
    results = [skills[sid] for sid in matched_ids if sid in skills]
    results.sort(key=lambda x: x.get("download_count", 0), reverse=True)
    
    return results


def get_skill_versions(skill_id: str) -> List[dict]:
    """获取技能的所有版本"""
    data = versions_db.read()
    versions = [
        v for v in data.get("versions", [])
        if v["skill_id"] == skill_id
    ]
    versions.sort(key=lambda x: x["created_at"], reverse=True)
    return versions


def delete_skill(skill_id: str) -> bool:
    """删除技能及其所有版本"""
    try:
        # 删除文件
        skill_dir = STORAGE_DIR / skill_id
        if skill_dir.exists():
            shutil.rmtree(skill_dir)
        
        # 删除数据库记录
        def delete_from_db(data):
            data["skills"] = [s for s in data.get("skills", []) if s["id"] != skill_id]
        
        def delete_versions(data):
            data["versions"] = [v for v in data.get("versions", []) if v["skill_id"] != skill_id]
        
        def delete_from_index(data):
            index = data.get("index", {})
            for word in list(index.keys()):
                if skill_id in index[word]:
                    index[word].remove(skill_id)
                if not index[word]:
                    del index[word]
            data["index"] = index
        
        skills_db.update(delete_from_db)
        versions_db.update(delete_versions)
        search_db.update(delete_from_index)
        
        return True
    except Exception:
        return False
