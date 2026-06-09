/**
 * Skill 发布校验工具
 * 包含：中文名称检查、简介长度检查、脱敏规则检查
 */

export interface ValidationError {
  type: 'name' | 'description' | 'sensitive' | 'size'
  message: string
  line?: number
  level?: 'high' | 'medium' | 'low'
  content?: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  name?: string
  description?: string
  fileSize?: number
}

// 脱敏规则配置（与后端保持一致）
export const SENSITIVE_PATTERNS = [
  // 认证凭证（高风险）
  { pattern: /token\s*[=:]\s*["'][^"']+["']/i, name: 'Token', level: 'high' as const },
  { pattern: /password\s*[=:]\s*["'][^"']+["']/i, name: 'Password', level: 'high' as const },
  { pattern: /api_key\s*[=:]\s*["'][^"']+["']/i, name: 'API Key', level: 'high' as const },
  { pattern: /secret\s*[=:]\s*["'][^"']+["']/i, name: 'Secret', level: 'high' as const },
  { pattern: /Bearer\s+[a-zA-Z0-9\-_]+/i, name: 'Bearer Token', level: 'high' as const },
  { pattern: /authorization\s*[=:]\s*["'][^"']+["']/i, name: 'Authorization', level: 'high' as const },
  
  // 应用凭证（中风险）
  { pattern: /app_id\s*[=:]\s*["'][^"']+["']/i, name: 'App ID', level: 'medium' as const },
  { pattern: /client_secret\s*[=:]\s*["'][^"']+["']/i, name: 'Client Secret', level: 'high' as const },
  { pattern: /auth\s*[=:]\s*["'][^"']+["']/i, name: 'Auth', level: 'medium' as const },
  
  // 数据库连接（高风险）
  { pattern: /jdbc:\w+:\/\/[^;\s]+/i, name: 'JDBC Connection', level: 'high' as const },
  { pattern: /mongodb:\/\/[^/\s]+/i, name: 'MongoDB Connection', level: 'high' as const },
  { pattern: /redis:\/\/[^/\s]+/i, name: 'Redis Connection', level: 'high' as const },
  { pattern: /mysql:\/\/[^/\s]+/i, name: 'MySQL Connection', level: 'high' as const },
  { pattern: /postgresql:\/\/[^/\s]+/i, name: 'PostgreSQL Connection', level: 'high' as const },
  
  // 内网IP（中风险）
  { pattern: /(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)/, name: 'Internal IP', level: 'medium' as const },
  
  // Webhook（高风险）
  { pattern: /https:\/\/(open\.feishu|oapi\.dingtalk|qyapi\.weixin)\.cn\/[^"\s]+/i, name: 'Webhook URL', level: 'high' as const },
  
  // 云服务密钥（高风险）
  { pattern: /(AKID|AKSecret|LTAI)[a-zA-Z0-9\-_]+/i, name: 'Cloud Access Key', level: 'high' as const },
  { pattern: /(AWS|阿里云|腾讯云|华为云)\s*(密钥|key|secret)/i, name: 'Cloud Secret', level: 'high' as const },
]

// 白名单：允许出现在代码示例中的模式
const WHITELIST_PATTERNS = [
  /example[_-]?(password|token|key|secret)/i,
  /demo[_-]?(password|token|key|secret)/i,
  /test[_-]?(password|token|key|secret)/i,
  /your[_-]?(password|token|key|secret)/i,
  /placeholder/i,
  /xxx+/,  // 如 "token=xxx"
  /\*\*\*+/,  // 已脱敏的 ***
]

/**
 * 检查是否在白名单中
 */
function isWhitelisted(content: string): boolean {
  return WHITELIST_PATTERNS.some(pattern => pattern.test(content))
}

/**
 * 检查文本是否包含中文字符
 */
export function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text)
}

/**
 * 检查 skill.md 内容中的敏感信息
 */
export function checkSensitiveContent(content: string): ValidationError[] {
  const errors: ValidationError[] = []
  const lines = content.split('\n')
  
  for (let lineNo = 0; lineNo < lines.length; lineNo++) {
    const line = lines[lineNo]
    
    for (const rule of SENSITIVE_PATTERNS) {
      if (rule.pattern.test(line)) {
        // 检查是否在白名单中
        if (isWhitelisted(line)) {
          continue
        }
        
        errors.push({
          type: 'sensitive',
          message: `发现${rule.name}（${rule.level === 'high' ? '高风险' : '中风险'}）`,
          line: lineNo + 1,
          level: rule.level,
          content: line.trim().substring(0, 100),
        })
      }
    }
  }
  
  return errors
}

/**
 * 解析 skill.md 内容
 */
export function parseSkillMd(content: string): { name: string; description: string; readmeContent: string } {
  content = content.replace(/^\ufeff/, '')
  let name = ''
  let description = ''
  let readmeContent = content
  
  const lines = content.split('\n')
  
  // 检查是否有 YAML frontmatter
  if (lines.length > 0 && lines[0].trim() === '---') {
    let endIdx = -1
    const yamlLines: string[] = []
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        endIdx = i
        break
      }
      yamlLines.push(lines[i])
    }
    
    if (endIdx > 0) {
      for (const line of yamlLines) {
        const colonIndex = line.indexOf(':')
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim()
          const value = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '')
          
          if (key === 'name') {
            name = value
          } else if (key === 'description') {
            description = value
          }
        }
      }
      
      readmeContent = lines.slice(endIdx + 1).join('\n').trim()
    }
  }
  
  // 如果没有 frontmatter，尝试从第一行获取名称
  if (!name && lines.length > 0) {
    name = lines[0].replace(/^#+\s*/, '').trim()
  }
  
  // 如果没有 description，尝试从后续行获取
  if (!description && lines.length > 1) {
    description = lines.slice(1).join('\n').trim()
  }
  
  return { name, description, readmeContent }
}

/**
 * 验证 skill 元数据
 */
export function validateSkillMetadata(name: string, description: string): ValidationError[] {
  const errors: ValidationError[] = []
  
  // 检查名称是否为中文
  if (!containsChinese(name)) {
    errors.push({
      type: 'name',
      message: `技能名称「${name || '空'}」必须包含中文字符`,
    })
  }
  
  // 检查简介长度（200字限制）
  if (description.length > 200) {
    errors.push({
      type: 'description',
      message: `技能简介长度 ${description.length} 字，超过 200 字限制`,
    })
  }
  
  return errors
}

/**
 * 验证 skill 压缩包
 */
export async function validateSkillPackage(file: File): Promise<ValidationResult> {
  const errors: ValidationError[] = []
  let name = ''
  let description = ''
  
  // 1. 检查文件大小（3MB = 3145728 bytes）
  const MAX_FILE_SIZE = 3 * 1024 * 1024
  if (file.size > MAX_FILE_SIZE) {
    errors.push({
      type: 'size',
      message: `文件大小 ${(file.size / 1024 / 1024).toFixed(2)}MB，超过 3MB 限制`,
    })
    return { valid: false, errors, fileSize: file.size }
  }
  
  try {
    // 2. 解压并读取 skill.md
    const JSZipModule = await import('jszip')
    const JSZip = JSZipModule.default
    const zip = await JSZip.loadAsync(file)
    
    // 查找 skill.md（不区分大小写）
    let skillMdFile: any = null
    let skillMdPath = ''
    
    zip.forEach((path: string, zipEntry: any) => {
      if (!skillMdFile && path.toLowerCase().endsWith('skill.md')) {
        skillMdFile = zipEntry
        skillMdPath = path
      }
    })
    
    if (!skillMdFile) {
      errors.push({
        type: 'name',
        message: '压缩包中未找到 skill.md 文件',
      })
      return { valid: false, errors, fileSize: file.size }
    }
    
    // 3. 读取 skill.md 内容
    const skillMdContent = await skillMdFile.async('string')
    
    // 4. 解析 skill.md
    const parsed = parseSkillMd(skillMdContent)
    name = parsed.name
    description = parsed.description
    
    // 5. 验证元数据
    const metadataErrors = validateSkillMetadata(name, description)
    errors.push(...metadataErrors)
    
    // 6. 检查敏感信息（全量检查整个 skill.md）
    const sensitiveErrors = checkSensitiveContent(skillMdContent)
    errors.push(...sensitiveErrors)
    
  } catch (error) {
    errors.push({
      type: 'name',
      message: `无法解析压缩包：${error instanceof Error ? error.message : '未知错误'}`,
    })
  }
  
  return {
    valid: errors.length === 0,
    errors,
    name,
    description,
    fileSize: file.size,
  }
}
