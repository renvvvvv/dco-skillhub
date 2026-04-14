import http.client
import mimetypes
import uuid
import os

# 创建 multipart/form-data
def encode_multipart_formdata(fields, files):
    boundary = uuid.uuid4().hex
    lines = []
    
    for key, value in fields.items():
        lines.append(f'--{boundary}'.encode())
        lines.append(f'Content-Disposition: form-data; name="{key}"'.encode())
        lines.append(b'')
        lines.append(value.encode() if isinstance(value, str) else value)
    
    for key, filename in files.items():
        lines.append(f'--{boundary}'.encode())
        lines.append(f'Content-Disposition: form-data; name="{key}"; filename="{filename}"'.encode())
        lines.append(f'Content-Type: application/zip'.encode())
        lines.append(b'')
        with open(filename, 'rb') as f:
            lines.append(f.read())
    
    lines.append(f'--{boundary}--'.encode())
    lines.append(b'')
    
    body = b'\r\n'.join(lines)
    headers = {'Content-Type': f'multipart/form-data; boundary={boundary}'}
    return body, headers

# 准备数据
fields = {
    'authorName': 'Demo User',
    'authorEmail': 'demo@example.com',
    'adminKey': 'demo-key-123',
    'version': '1.0.0',
    'tag': 'stable'
}

files = {
    'skillZip': 'email-sender.zip'
}

# 发送请求
body, headers = encode_multipart_formdata(fields, files)

conn = http.client.HTTPConnection('localhost', 80)
conn.request('POST', '/api/skills', body, headers)
response = conn.getresponse()

print(f'Status: {response.status}')
print(f'Response: {response.read().decode()}')
conn.close()
