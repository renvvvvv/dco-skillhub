"""业务逻辑服务"""
import hashlib
import zipfile
import re
import shutil
from pathlib import Path
from datetime import datetime
from typing import List, Optional
from app.config import STORAGE_DIR
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


def extract_skill_md(zip_path: Path) -> dict:
    """从 ZIP 中提取并解析 skill.md"""
    with zipfile.ZipFile(zip_path, 'r') as zf:
        # 查找 skill.md（不区分大小写）
        skill_md_files = [
            f for f in zf.namelist()
            if f.lower().endswith('skill.md')
        ]
        
        if not skill_md_files:
            raise ValueError("ZIP 中未找到 skill.md 文件")
        
        # 读取内容
        content = zf.read(skill_md_files[0]).decode('utf-8')
        
        # 移除 BOM 字符（如果有）
        content = content.lstrip('\ufeff')
        
        # 尝试解析 YAML frontmatter 格式
        # 格式: ---\nname: xxx\ndescription: xxx\n---\nreadme content
        name = None
        description = None
        readme_content = content
        
        lines = content.split('\n')
        
        # 检查是否是 YAML frontmatter 格式
        if lines and lines[0].strip() == '---':
            # 找到第二个 ---
            end_idx = -1
            yaml_lines = []
            
            for i, line in enumerate(lines[1:], start=1):
                if line.strip() == '---':
                    end_idx = i
                    break
                yaml_lines.append(line)
            
            if end_idx > 0:
                # 解析 YAML
                for line in yaml_lines:
                    if ':' in line:
                        key, value = line.split(':', 1)
                        key = key.strip()
                        value = value.strip().strip('"').strip("'")
                        if key == 'name':
                            name = value
                        elif key == 'description':
                            description = value
                
                # readme 内容是 YAML 之后的内容
                readme_lines = lines[end_idx + 1:]
                readme_content = '\n'.join(readme_lines).strip()
        
        # 如果不是 YAML 格式，使用旧的方式解析
        if not name:
            # 第一行是标题
            name = lines[0].lstrip('#').strip() if lines else "Unknown"
        
        if not description:
            # 描述取前 200 字符
            description = '\n'.join(lines[1:]).strip() if len(lines) > 1 else ""
        
        description = description[:200]
        
        # 确保 name 不为空（避免生成空 slug）
        if not name or name == '---':
            name = "Unnamed Skill"
        
        return {
            "name": name,
            "description": description,
            "readme_content": readme_content or content
        }


def generate_slug(name: str) -> str:
    """生成 URL 友好的 slug"""
    # 转小写，替换空格为 -，移除特殊字符
    slug = name.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')


def update_search_index(skill: dict):
    """更新搜索索引"""
    def updater(data):
        index = data.get("index", {})
        
        # 提取关键词（中英文分词）
        text = f"{skill.get('name', '')} {skill.get('description', '')}"
        
        # 英文按空格分词
        words = set()
        for word in text.lower().split():
            words.add(word)
            # 添加子串（前缀匹配）
            for i in range(2, len(word) + 1):
                words.add(word[:i])
        
        # 中文按字符分词
        for char in text:
            if '\u4e00' <= char <= '\u9fff':  # 中文字符
                words.add(char)
        
        # 更新索引
        skill_id = skill["id"]
        for word in words:
            if word not in index:
                index[word] = []
            if skill_id not in index[word]:
                index[word].append(skill_id)
        
        data["index"] = index
    
    search_db.update(updater)


def search_skills(query: str) -> List[dict]:
    """搜索技能"""
    if not query.strip():
        return []
    
    # 读取数据
    skills_data = skills_db.read()
    search_data = search_db.read()
    
    skills = {s["id"]: s for s in skills_data.get("skills", [])}
    index = search_data.get("index", {})
    
    # 分词搜索
    query_words = query.lower().split()
    matched_ids = set()
    
    for word in query_words:
        # 精确匹配
        if word in index:
            matched_ids.update(index[word])
        
        # 前缀匹配
        for key, ids in index.items():
            if key.startswith(word):
                matched_ids.update(ids)
    
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
