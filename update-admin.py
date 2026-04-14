#!/usr/bin/env python3
import hashlib
import json

# 计算 vnet.com 的哈希
new_hash = hashlib.sha256('vnet.com'.encode()).hexdigest()
print(f'New hash for vnet.com: {new_hash}')

# 读取技能数据
with open('/app/data/skills.json', 'r') as f:
    data = json.load(f)

# 更新所有技能的管理员密钥
for skill in data['skills']:
    old_hash = skill.get('admin_key_hash', 'N/A')
    skill['admin_key_hash'] = new_hash
    name = skill.get('name') or skill.get('id') or 'Unknown'
    print(f'Updated {name}: {old_hash[:16]}... -> {new_hash[:16]}...')

# 保存
with open('/app/data/skills.json', 'w') as f:
    json.dump(data, f, indent=2)

print(f'\nDone! Updated {len(data["skills"])} skills')
