import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { UploadZone } from '@/features/publish/upload-zone'
import {
  extractPrecheckWarnings,
  isFrontmatterFailureMessage,
  isPrecheckConfirmationMessage,
  isPrecheckFailureMessage,
  isVersionExistsMessage,
} from '@/features/publish/publish-error-utils'
import { Button } from '@/shared/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  normalizeSelectValue,
} from '@/shared/ui/select'
import { Label } from '@/shared/ui/label'
import { Card } from '@/shared/ui/card'
import { usePublishSkill } from '@/shared/hooks/use-skill-queries'
import { useMyNamespaces } from '@/shared/hooks/use-namespace-queries'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import { DashboardPageHeader } from '@/shared/components/dashboard-page-header'
import { toast } from '@/shared/lib/toast'
import { ApiError } from '@/api/client'
import { validateSkillPackage, type ValidationResult } from '@/shared/lib/skill-validator'

const EMPTY_NAMESPACE_VALUE = '__select_namespace__'

export function PublishPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [namespaceSlug, setNamespaceSlug] = useState<string>('')
  const [visibility, setVisibility] = useState<string>('PUBLIC')
  const [warningDialogOpen, setWarningDialogOpen] = useState(false)
  const [precheckWarnings, setPrecheckWarnings] = useState<string[]>([])
  const [isValidating, setIsValidating] = useState(false)
  
  // 安全性验证报告弹窗
  const [securityReportOpen, setSecurityReportOpen] = useState(false)
  const [securityReport, setSecurityReport] = useState<ValidationResult | null>(null)
  const [pendingPublish, setPendingPublish] = useState(false)

  const { data: namespaces, isLoading: isLoadingNamespaces } = useMyNamespaces()
  const publishMutation = usePublishSkill()
  const selectedNamespace = namespaces?.find((ns) => ns.slug === namespaceSlug)
  const namespaceOnlyLabel = selectedNamespace?.type === 'GLOBAL'
    ? t('publish.visibilityOptions.loggedInUsersOnly')
    : t('publish.visibilityOptions.namespaceOnly')

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null)
    setPrecheckWarnings([])
    setWarningDialogOpen(false)
    setSecurityReport(null)
    setSecurityReportOpen(false)
  }

  const handleFileSelect = async (file: File | null) => {
    setSelectedFile(file)
    setPrecheckWarnings([])
    setWarningDialogOpen(false)
    setSecurityReport(null)
    setSecurityReportOpen(false)
    
    if (file) {
      // 前端预检：文件大小和 skill.md 内容
      setIsValidating(true)
      try {
        const result = await validateSkillPackage(file)
        // 只保存结果，不自动弹窗
        setSecurityReport(result)
      } catch (error) {
        console.error('Validation error:', error)
        toast.error('文件校验失败', error instanceof Error ? error.message : '未知错误')
      } finally {
        setIsValidating(false)
      }
    }
  }

  const publishSkill = async (confirmWarnings = false) => {
    if (!selectedFile || !namespaceSlug) {
      toast.error(t('publish.selectRequired'))
      return
    }

    try {
      const result = await publishMutation.mutateAsync({
        namespace: namespaceSlug,
        file: selectedFile,
        visibility,
        confirmWarnings,
      })
      setPrecheckWarnings([])
      setWarningDialogOpen(false)
      const skillLabel = `${result.namespace}/${result.slug}@${result.version}`
      if (result.status === 'PUBLISHED') {
        toast.success(
          t('publish.publishedTitle'),
          t('publish.publishedDescription', { skill: skillLabel })
        )
      } else {
        toast.success(
          t('publish.pendingReviewTitle'),
          t('publish.pendingReviewDescription', { skill: skillLabel })
        )
      }
      navigate({ to: '/dashboard/skills' })
    } catch (error) {
      if (error instanceof ApiError && error.status === 408) {
        toast.error(t('publish.timeoutTitle'), t('publish.timeoutDescription'))
        return
      }

      if (error instanceof ApiError && isVersionExistsMessage(error.serverMessage || error.message)) {
        toast.error(
          t('publish.versionExistsTitle'),
          t('publish.versionExistsDescription'),
        )
        return
      }

      if (error instanceof ApiError && isPrecheckConfirmationMessage(error.serverMessage || error.message)) {
        setPrecheckWarnings(extractPrecheckWarnings(error.serverMessage || error.message))
        setWarningDialogOpen(true)
        return
      }

      if (error instanceof ApiError && isPrecheckFailureMessage(error.serverMessage || error.message)) {
        toast.error(
          t('publish.precheckFailedTitle'),
          error.serverMessage || t('publish.precheckFailedDescription'),
        )
        return
      }

      if (error instanceof ApiError && isFrontmatterFailureMessage(error.serverMessage || error.message)) {
        toast.error(
          t('publish.frontmatterFailedTitle'),
          error.serverMessage || t('publish.frontmatterFailedDescription'),
        )
        return
      }

      toast.error(t('publish.error'), error instanceof Error ? error.message : '')
    }
  }

  const handlePublish = async () => {
    if (!selectedFile || !namespaceSlug) {
      toast.error(t('publish.selectRequired'))
      return
    }

    // 如果还没有生成安全性报告，先生成
    if (!securityReport) {
      setIsValidating(true)
      try {
        const result = await validateSkillPackage(selectedFile)
        setSecurityReport(result)
        
        if (!result.valid) {
          // 有错误，直接显示错误弹窗
          setSecurityReportOpen(true)
          return
        }
        
        // 无错误，显示安全性验证报告
        setSecurityReportOpen(true)
        setPendingPublish(true)
      } catch (error) {
        console.error('Validation error:', error)
        toast.error('文件校验失败', error instanceof Error ? error.message : '未知错误')
      } finally {
        setIsValidating(false)
      }
      return
    }

    // 已有报告
    if (!securityReport.valid) {
      // 有错误，显示错误弹窗
      setSecurityReportOpen(true)
      return
    }

    // 无错误，显示安全性验证报告
    setSecurityReportOpen(true)
    setPendingPublish(true)
  }

  const handleConfirmPublish = () => {
    setSecurityReportOpen(false)
    setPendingPublish(false)
    publishSkill(false)
  }

  const handleCancelPublish = () => {
    setSecurityReportOpen(false)
    setPendingPublish(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-up">
      <DashboardPageHeader title={t('publish.title')} subtitle={t('publish.subtitle')} />

      <Card className="p-4 bg-blue-500/5 border-blue-500/20">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground mb-1">{t('publish.reviewNotice.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('publish.reviewNotice.description')}</p>
          </div>
        </div>
      </Card>

      <Card className="p-8 space-y-8">
        <div className="space-y-3">
          <Label htmlFor="namespace" className="text-sm font-semibold font-heading">{t('publish.namespace')}</Label>
          {isLoadingNamespaces ? (
            <div className="h-11 animate-shimmer rounded-lg" />
          ) : (
            <Select
              value={normalizeSelectValue(namespaceSlug) ?? EMPTY_NAMESPACE_VALUE}
              onValueChange={(value) => {
                setNamespaceSlug(value === EMPTY_NAMESPACE_VALUE ? '' : value)
              }}
            >
              <SelectTrigger id="namespace">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EMPTY_NAMESPACE_VALUE}>{t('publish.selectNamespace')}</SelectItem>
                {namespaces?.map((ns) => (
                  <SelectItem key={ns.id} value={ns.slug}>
                    {ns.displayName} (@{ns.slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-3">
          <Label htmlFor="visibility" className="text-sm font-semibold font-heading">{t('publish.visibility')}</Label>
          <Select value={visibility} onValueChange={setVisibility}>
            <SelectTrigger id="visibility">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PUBLIC">{t('publish.visibilityOptions.public')}</SelectItem>
              <SelectItem value="NAMESPACE_ONLY">{namespaceOnlyLabel}</SelectItem>
              <SelectItem value="PRIVATE">{t('publish.visibilityOptions.private')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-semibold font-heading">{t('publish.file')}</Label>
          <UploadZone
            key={selectedFile ? `${selectedFile.name}-${selectedFile.lastModified}` : 'empty'}
            onFileSelect={handleFileSelect}
            disabled={publishMutation.isPending}
          />
          {selectedFile && (
            <div className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 ${
              securityReport && !securityReport.valid
                ? 'border-red-300 bg-red-50'
                : securityReport && securityReport.valid
                ? 'border-green-300 bg-green-50'
                : 'border-border/60 bg-secondary/30'
            }`}>
              <div className="min-w-0 text-sm text-muted-foreground flex items-center gap-2">
                <svg className={`w-4 h-4 flex-shrink-0 ${
                  securityReport && !securityReport.valid
                    ? 'text-red-500'
                    : securityReport && securityReport.valid
                    ? 'text-green-500'
                    : 'text-emerald-500'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {securityReport && !securityReport.valid ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : securityReport && securityReport.valid ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  )}
                </svg>
                <span className="truncate">
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  {securityReport && !securityReport.valid && (
                    <span className="text-red-500 ml-2">({securityReport.errors.length} 个问题)</span>
                  )}
                  {securityReport && securityReport.valid && (
                    <span className="text-green-600 ml-2">(检查通过)</span>
                  )}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveSelectedFile}
                disabled={publishMutation.isPending || isValidating}
              >
                {t('publish.removeSelectedFile')}
              </Button>
            </div>
          )}
        </div>

        <Button
          className="w-full text-primary-foreground disabled:text-primary-foreground"
          size="lg"
          onClick={handlePublish}
          disabled={!selectedFile || !namespaceSlug || publishMutation.isPending || isValidating}
        >
          {isValidating ? '校验中...' : publishMutation.isPending ? t('publish.publishing') : t('publish.confirm')}
        </Button>
      </Card>

      <ConfirmDialog
        open={warningDialogOpen}
        onOpenChange={setWarningDialogOpen}
        title={t('publish.warningConfirmTitle')}
        description={(
          <div className="space-y-3 text-left">
            <p>{t('publish.warningConfirmDescription')}</p>
            {precheckWarnings.length > 0 && (
              <ul className="list-disc space-y-1 pl-5">
                {precheckWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        confirmText={t('publish.warningConfirmContinue')}
        cancelText={t('publish.warningConfirmCancel')}
        onConfirm={() => publishSkill(true)}
      />

      {/* 安全性验证报告弹窗 */}
      <ConfirmDialog
        open={securityReportOpen}
        onOpenChange={setSecurityReportOpen}
        title={securityReport?.valid ? '安全性验证报告' : '发布检查未通过'}
        description={(
          <div className="space-y-4 text-left max-h-[500px] overflow-y-auto">
            {securityReport && (
              <>
                {/* 文件信息 */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">文件信息</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>文件名：{selectedFile?.name}</p>
                    <p>大小：{((securityReport.fileSize || 0) / 1024).toFixed(1)} KB</p>
                    {securityReport.name && <p>技能名称：{securityReport.name}</p>}
                    {securityReport.description && (
                      <p>简介：{securityReport.description.length} 字</p>
                    )}
                  </div>
                </div>

                {/* 检查结果 */}
                {securityReport.valid ? (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-semibold text-green-700">所有检查通过</span>
                    </div>
                    <ul className="text-sm text-green-600 space-y-1 ml-7">
                      <li>技能名称包含中文</li>
                      <li>简介长度符合要求（{securityReport.description?.length || 0} / 200 字）</li>
                      <li>未发现敏感信息</li>
                      <li>文件大小符合要求</li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-red-600 font-medium">
                      发现 {securityReport.errors.length} 个问题，请修改后重新上传：
                    </p>
                    {securityReport.errors.map((error, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          error.level === 'high'
                            ? 'bg-red-50 border-red-200'
                            : error.level === 'medium'
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            error.level === 'high'
                              ? 'bg-red-100 text-red-700'
                              : error.level === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {error.type === 'name' && '名称'}
                            {error.type === 'description' && '简介'}
                            {error.type === 'sensitive' && '敏感信息'}
                            {error.type === 'size' && '文件大小'}
                          </span>
                          {error.level && (
                            <span className={`text-xs ${
                              error.level === 'high' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                              {error.level === 'high' ? '高风险' : '中风险'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm mt-1 text-gray-700">{error.message}</p>
                        {error.line && (
                          <p className="text-xs text-gray-500 mt-1">第 {error.line} 行</p>
                        )}
                        {error.content && (
                          <p className="text-xs font-mono text-gray-600 mt-1 bg-gray-100 p-1 rounded truncate">
                            {error.content}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
        confirmText={securityReport?.valid ? '确认发布' : '我知道了'}
        cancelText={securityReport?.valid ? '取消' : ''}
        onConfirm={securityReport?.valid ? handleConfirmPublish : handleCancelPublish}
      />
    </div>
  )
}
