'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import {
  Search, Plus, ArrowLeft, Send, ChevronDown, ChevronUp, Activity, FileText,
  CheckCircle, AlertCircle, Loader2, Filter, Eye, Lightbulb, BarChart3,
  Clock, Users, Target, TrendingUp, Hash, Mail, BookOpen, Github, Calendar,
  X, ExternalLink, MessageSquare, Zap, PanelLeftClose, PanelLeft, Sparkles,
  AlertTriangle, ArrowRight, Quote, Star, Layers, LayoutDashboard, PenTool,
  Share2, ChevronRight, Link
} from 'lucide-react'

// ============================================================
// CONSTANTS
// ============================================================
const MANAGER_AGENT_ID = '699bfb968b71a4ceaa856261'
const DISTRIBUTION_AGENT_ID = '699bfbc969f2efc6b101759f'

const STORAGE_KEY = 'insightlens_sessions'

// ============================================================
// TYPES
// ============================================================
interface Finding {
  id: string
  category: string
  description: string
  user_quote: string
  emotional_intensity: string
  implicit_need: string
}

interface Theme {
  theme_name: string
  category: string
  description: string
  impact_score: number
  frequency: number
  priority_score: number
  supporting_findings: string[]
  key_quotes: string[]
}

interface TopInsight {
  rank: number
  insight: string
  supporting_theme: string
  urgency: string
}

interface ActionItem {
  action: string
  impact_score: number
  effort_estimate: string
  roadmap_alignment: string
  assigned_to: string
}

interface AnalysisResult {
  analysis_status: string
  parsed_findings: {
    findings: Finding[]
    total_findings: number
    summary: string
  }
  categorized_themes: {
    themes: Theme[]
    total_themes: number
    cross_cutting_patterns: string[]
  }
  executive_summary: {
    executive_narrative: string
    top_insights: TopInsight[]
    action_items: ActionItem[]
    roadmap_alignment_summary: string
    urgent_items: string[]
  }
}

interface DistributionChannel {
  channel_name: string
  status: string
  link: string
  details: string
}

interface DistributionResult {
  distribution_status: string
  channels: DistributionChannel[]
  github_issues_created: number
  summary_message: string
}

interface Session {
  id: string
  title: string
  date: string
  notes: string
  roadmapContext: string
  analysisResult: AnalysisResult | null
  distributionResult: DistributionResult | null
  status: 'analyzed' | 'distributed' | 'draft'
}

interface DistributionConfig {
  slackEnabled: boolean
  slackChannel: string
  gmailEnabled: boolean
  gmailRecipients: string
  gmailSubject: string
  notionEnabled: boolean
  notionParent: string
  githubEnabled: boolean
  githubRepo: string
  githubLabels: string
  calendarEnabled: boolean
  calendarDate: string
  calendarAttendees: string
}

// ============================================================
// SAMPLE DATA
// ============================================================
const SAMPLE_SESSIONS: Session[] = [
  {
    id: 'sample-1',
    title: 'Enterprise Onboarding Friction Analysis',
    date: '2026-02-20T10:30:00Z',
    notes: 'Interview with Sarah, VP of Engineering at Acme Corp. Major pain points around SSO integration taking 3 weeks...',
    roadmapContext: 'Q2 priorities: SSO improvements, dashboard redesign',
    analysisResult: {
      analysis_status: 'completed',
      parsed_findings: {
        findings: [
          { id: 'f1', category: 'pain_point', description: 'SSO integration takes 3 weeks minimum, causing delayed onboarding for enterprise teams', user_quote: 'We lost two weeks just trying to get SAML working with your system', emotional_intensity: 'high', implicit_need: 'Faster enterprise onboarding with pre-built SSO connectors' },
          { id: 'f2', category: 'feature_request', description: 'Users want bulk user import via CSV with role mapping', user_quote: 'I need to onboard 200 people and doing it one by one is not feasible', emotional_intensity: 'high', implicit_need: 'Scalable team provisioning for enterprise deployments' },
          { id: 'f3', category: 'workflow_issue', description: 'Admin dashboard lacks visibility into pending invitations and activation status', user_quote: 'I have no idea which of my team members have actually activated their accounts', emotional_intensity: 'medium', implicit_need: 'Transparent team activation tracking' },
          { id: 'f4', category: 'positive_feedback', description: 'API documentation is excellent and well-organized', user_quote: 'Your API docs are honestly the best I have worked with', emotional_intensity: 'medium', implicit_need: 'Continue investing in developer experience' },
          { id: 'f5', category: 'behavioral_observation', description: 'User frequently switched between admin panel and email to check invitation status', user_quote: '', emotional_intensity: 'low', implicit_need: 'Consolidated notification center within the product' },
        ],
        total_findings: 5,
        summary: 'Enterprise onboarding is the critical bottleneck. SSO setup complexity and lack of bulk provisioning tools are the primary friction points for large team deployments.'
      },
      categorized_themes: {
        themes: [
          { theme_name: 'Enterprise Onboarding Complexity', category: 'pain_point', description: 'Multiple friction points in the enterprise onboarding journey from SSO setup to user provisioning', impact_score: 9.2, frequency: 3, priority_score: 9.5, supporting_findings: ['f1', 'f2', 'f3'], key_quotes: ['We lost two weeks just trying to get SAML working', 'I need to onboard 200 people and doing it one by one is not feasible'] },
          { theme_name: 'Visibility and Transparency', category: 'workflow_issue', description: 'Lack of clear status indicators for team activation and invitation tracking', impact_score: 7.5, frequency: 2, priority_score: 7.0, supporting_findings: ['f3', 'f5'], key_quotes: ['I have no idea which of my team members have actually activated their accounts'] },
          { theme_name: 'Developer Experience Excellence', category: 'positive_feedback', description: 'Strong positive sentiment around API documentation quality', impact_score: 6.0, frequency: 1, priority_score: 5.0, supporting_findings: ['f4'], key_quotes: ['Your API docs are honestly the best I have worked with'] },
        ],
        total_themes: 3,
        cross_cutting_patterns: ['Enterprise scalability is the dominant concern', 'Users need self-service tools to reduce dependency on support', 'Strong technical foundation but gaps in admin tooling']
      },
      executive_summary: {
        executive_narrative: 'This research session reveals significant friction in the enterprise onboarding journey. The primary pain points center around SSO integration complexity and lack of bulk provisioning tools. These issues directly impact time-to-value for enterprise customers and represent a retention risk. However, the strong positive feedback on API documentation indicates a solid technical foundation to build upon.',
        top_insights: [
          { rank: 1, insight: 'SSO integration is the single biggest enterprise onboarding bottleneck, taking 3+ weeks', supporting_theme: 'Enterprise Onboarding Complexity', urgency: 'critical' },
          { rank: 2, insight: 'Lack of bulk user provisioning forces manual onboarding for large teams', supporting_theme: 'Enterprise Onboarding Complexity', urgency: 'high' },
          { rank: 3, insight: 'Admin dashboard needs activation tracking to reduce support overhead', supporting_theme: 'Visibility and Transparency', urgency: 'medium' },
        ],
        action_items: [
          { action: 'Build pre-configured SSO connectors for top 5 identity providers (Okta, Azure AD, OneLogin, Ping, Google Workspace)', impact_score: 9.5, effort_estimate: 'high', roadmap_alignment: 'aligned', assigned_to: 'Platform Team' },
          { action: 'Implement CSV bulk user import with role mapping and validation', impact_score: 8.5, effort_estimate: 'medium', roadmap_alignment: 'aligned', assigned_to: 'Growth Team' },
          { action: 'Add invitation tracking dashboard with activation status and reminders', impact_score: 7.0, effort_estimate: 'low', roadmap_alignment: 'new_opportunity', assigned_to: 'Product Team' },
          { action: 'Create onboarding progress checklist for enterprise admins', impact_score: 6.5, effort_estimate: 'low', roadmap_alignment: 'new_opportunity', assigned_to: 'Product Team' },
        ],
        roadmap_alignment_summary: 'SSO improvements and bulk provisioning align directly with Q2 priorities. Admin dashboard enhancements represent new opportunities that complement the existing roadmap.',
        urgent_items: ['SSO integration bottleneck is causing enterprise churn risk', 'Bulk provisioning needed before next enterprise cohort onboards in March']
      }
    },
    distributionResult: null,
    status: 'analyzed'
  },
  {
    id: 'sample-2',
    title: 'Mobile App Usability Study - Navigation Patterns',
    date: '2026-02-18T14:00:00Z',
    notes: 'Usability testing session with 5 participants on the mobile app redesign...',
    roadmapContext: 'Mobile app v2.0 launch in Q3',
    analysisResult: null,
    distributionResult: null,
    status: 'draft'
  },
  {
    id: 'sample-3',
    title: 'Churn Analysis - Mid-Market Segment',
    date: '2026-02-15T09:00:00Z',
    notes: 'Exit interviews with 3 churned mid-market accounts...',
    roadmapContext: 'Retention initiative, pricing review',
    analysisResult: {
      analysis_status: 'completed',
      parsed_findings: {
        findings: [
          { id: 'c1', category: 'pain_point', description: 'Pricing model penalizes growth - costs jump 3x when team exceeds 50 seats', user_quote: 'We loved the product but the price cliff at 50 users was a dealbreaker', emotional_intensity: 'high', implicit_need: 'Graduated pricing that scales with team size' },
        ],
        total_findings: 1,
        summary: 'Pricing model is the dominant churn driver for mid-market accounts approaching the 50-seat threshold.'
      },
      categorized_themes: {
        themes: [
          { theme_name: 'Pricing Scalability', category: 'pain_point', description: 'Current pricing tiers create a cliff that drives churn at growth thresholds', impact_score: 9.8, frequency: 3, priority_score: 10, supporting_findings: ['c1'], key_quotes: ['The price cliff at 50 users was a dealbreaker'] },
        ],
        total_themes: 1,
        cross_cutting_patterns: ['Pricing is the primary churn vector for growing accounts']
      },
      executive_summary: {
        executive_narrative: 'Mid-market churn is primarily driven by pricing model discontinuities. Accounts approaching the 50-seat threshold face a 3x cost increase that forces them to evaluate alternatives.',
        top_insights: [
          { rank: 1, insight: 'Pricing cliff at 50 seats is the primary mid-market churn driver', supporting_theme: 'Pricing Scalability', urgency: 'critical' },
        ],
        action_items: [
          { action: 'Redesign pricing tiers with graduated per-seat pricing', impact_score: 10, effort_estimate: 'medium', roadmap_alignment: 'aligned', assigned_to: 'Revenue Team' },
        ],
        roadmap_alignment_summary: 'Directly supports the retention initiative.',
        urgent_items: ['Revenue at risk from pricing-driven churn']
      }
    },
    distributionResult: {
      distribution_status: 'completed',
      channels: [
        { channel_name: 'Slack', status: 'sent', link: 'https://slack.com/archives/C0123456789', details: 'Posted to #product-research' },
        { channel_name: 'Gmail', status: 'sent', link: '', details: 'Sent to team@company.com' },
      ],
      github_issues_created: 1,
      summary_message: 'Research insights distributed to 2 channels, 1 GitHub issue created.'
    },
    status: 'distributed'
  }
]

// ============================================================
// THEME
// ============================================================
const THEME_VARS: React.CSSProperties & Record<string, string> = {
  '--background': '0 0% 100%',
  '--foreground': '222 47% 11%',
  '--card': '0 0% 98%',
  '--card-foreground': '222 47% 11%',
  '--primary': '222 47% 11%',
  '--primary-foreground': '210 40% 98%',
  '--secondary': '210 40% 96%',
  '--secondary-foreground': '222 47% 11%',
  '--muted': '210 40% 94%',
  '--muted-foreground': '215 16% 47%',
  '--border': '214 32% 91%',
  '--destructive': '0 84% 60%',
  '--ring': '222 47% 11%',
  '--radius': '0.875rem',
  '--chart-1': '12 76% 61%',
  '--chart-2': '173 58% 39%',
  '--chart-3': '197 37% 24%',
  '--chart-4': '43 74% 66%',
  '--chart-5': '27 87% 67%',
}

// ============================================================
// HELPERS
// ============================================================
function getCategoryColor(category: string): string {
  switch (category?.toLowerCase()) {
    case 'pain_point': return 'bg-red-100 text-red-800 border-red-200'
    case 'feature_request': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'workflow_issue': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'positive_feedback': return 'bg-green-100 text-green-800 border-green-200'
    case 'behavioral_observation': return 'bg-purple-100 text-purple-800 border-purple-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function getCategoryLabel(category: string): string {
  switch (category?.toLowerCase()) {
    case 'pain_point': return 'Pain Point'
    case 'feature_request': return 'Feature Request'
    case 'workflow_issue': return 'Workflow Issue'
    case 'positive_feedback': return 'Positive Feedback'
    case 'behavioral_observation': return 'Observation'
    default: return category ?? 'Unknown'
  }
}

function getUrgencyColor(urgency: string): string {
  switch (urgency?.toLowerCase()) {
    case 'critical': return 'bg-red-500 text-white'
    case 'high': return 'bg-orange-500 text-white'
    case 'medium': return 'bg-yellow-500 text-white'
    case 'low': return 'bg-green-500 text-white'
    default: return 'bg-gray-400 text-white'
  }
}

function getIntensityColor(intensity: string): string {
  switch (intensity?.toLowerCase()) {
    case 'high': return 'text-red-600'
    case 'medium': return 'text-amber-600'
    case 'low': return 'text-green-600'
    default: return 'text-gray-500'
  }
}

function getAlignmentConfig(alignment: string): { color: string; label: string } {
  switch (alignment?.toLowerCase()) {
    case 'aligned': return { color: 'bg-green-100 text-green-800 border-green-200', label: 'Aligned' }
    case 'new_opportunity': return { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'New Opportunity' }
    case 'deprioritized': return { color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Deprioritized' }
    case 'not_applicable': return { color: 'bg-gray-100 text-gray-600 border-gray-200', label: 'N/A' }
    default: return { color: 'bg-gray-100 text-gray-600 border-gray-200', label: alignment ?? 'Unknown' }
  }
}

function getEffortConfig(effort: string): { color: string; label: string } {
  switch (effort?.toLowerCase()) {
    case 'low': return { color: 'bg-green-50 text-green-700', label: 'Low Effort' }
    case 'medium': return { color: 'bg-yellow-50 text-yellow-700', label: 'Medium Effort' }
    case 'high': return { color: 'bg-red-50 text-red-700', label: 'High Effort' }
    default: return { color: 'bg-gray-50 text-gray-600', label: effort ?? 'Unknown' }
  }
}

function getStatusBadge(status: string): { color: string; label: string } {
  switch (status) {
    case 'analyzed': return { color: 'bg-blue-100 text-blue-700', label: 'Analyzed' }
    case 'distributed': return { color: 'bg-green-100 text-green-700', label: 'Distributed' }
    case 'draft': return { color: 'bg-gray-100 text-gray-600', label: 'Draft' }
    default: return { color: 'bg-gray-100 text-gray-600', label: 'Unknown' }
  }
}

function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateString ?? ''
  }
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm leading-relaxed">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

// ============================================================
// STORAGE HELPERS
// ============================================================
function loadSessions(): Session[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveSessions(sessions: Session[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  } catch {
    // silent fail
  }
}

// ============================================================
// INLINE COMPONENTS
// ============================================================

function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white/75 backdrop-blur-[16px] border border-white/[0.18] rounded-[0.875rem] shadow-md", className)}>
      {children}
    </div>
  )
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent?: string }) {
  return (
    <GlassCard className="p-5 flex items-center gap-4">
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", accent ?? 'bg-primary/10')}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground font-medium tracking-tight">{label}</p>
      </div>
    </GlassCard>
  )
}

function InlineStatus({ type, message }: { type: 'success' | 'error' | 'info' | 'warning'; message: string }) {
  const config = {
    success: { bg: 'bg-green-50 border-green-200', text: 'text-green-800', icon: <CheckCircle className="h-4 w-4 text-green-600" /> },
    error: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', icon: <AlertCircle className="h-4 w-4 text-red-600" /> },
    info: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', icon: <Activity className="h-4 w-4 text-blue-600" /> },
    warning: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', icon: <AlertTriangle className="h-4 w-4 text-amber-600" /> },
  }
  const c = config[type]
  return (
    <div className={cn("flex items-center gap-2 px-4 py-3 rounded-[0.875rem] border text-sm", c.bg, c.text)}>
      {c.icon}
      <span>{message}</span>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm font-medium text-muted-foreground">Analyzing interview data...</span>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-[0.875rem]" />
          <Skeleton className="h-32 w-full rounded-[0.875rem]" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-[0.875rem]" />
          <Skeleton className="h-24 w-full rounded-[0.875rem]" />
          <Skeleton className="h-24 w-full rounded-[0.875rem]" />
        </div>
      </div>
    </div>
  )
}

function AgentStatusPanel({ activeAgentId }: { activeAgentId: string | null }) {
  const agents = [
    { id: MANAGER_AGENT_ID, name: 'Research Analysis Manager', purpose: 'Coordinates interview parsing, theme extraction, and summary generation' },
    { id: DISTRIBUTION_AGENT_ID, name: 'Stakeholder Distribution Agent', purpose: 'Distributes insights via Slack, Gmail, Notion, GitHub, Calendar' },
  ]
  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold tracking-tight text-foreground uppercase">AI Agents</span>
      </div>
      <div className="space-y-2">
        {agents.map((agent) => (
          <div key={agent.id} className="flex items-start gap-2 text-xs">
            <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", activeAgentId === agent.id ? 'bg-green-500 animate-pulse' : 'bg-gray-300')} />
            <div>
              <p className="font-medium text-foreground">{agent.name}</p>
              <p className="text-muted-foreground leading-relaxed">{agent.purpose}</p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

// ============================================================
// ERROR BOUNDARY
// ============================================================
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function Page() {
  // Navigation
  const [screen, setScreen] = useState<'dashboard' | 'analysis' | 'results'>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sampleMode, setSampleMode] = useState(false)

  // Sessions
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  // Analysis input
  const [interviewNotes, setInterviewNotes] = useState('')
  const [roadmapContext, setRoadmapContext] = useState('')
  const [roadmapOpen, setRoadmapOpen] = useState(false)

  // Loading / Status
  const [analyzing, setAnalyzing] = useState(false)
  const [distributing, setDistributing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // Distribution
  const [distributionDialogOpen, setDistributionDialogOpen] = useState(false)
  const [distConfig, setDistConfig] = useState<DistributionConfig>({
    slackEnabled: true,
    slackChannel: '#product-research',
    gmailEnabled: true,
    gmailRecipients: '',
    gmailSubject: '',
    notionEnabled: false,
    notionParent: '',
    githubEnabled: true,
    githubRepo: '',
    githubLabels: 'research-insight',
    calendarEnabled: false,
    calendarDate: '',
    calendarAttendees: '',
  })

  // Search / Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Load sessions on mount
  useEffect(() => {
    const stored = loadSessions()
    setSessions(stored)
  }, [])

  // Save sessions whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      saveSessions(sessions)
    }
  }, [sessions])

  // Get current display sessions
  const displaySessions = sampleMode ? SAMPLE_SESSIONS : sessions

  const filteredSessions = displaySessions.filter((s) => {
    const matchesSearch = !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.notes.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === 'all' || s.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const activeSession = displaySessions.find((s) => s.id === activeSessionId) ?? null

  // Stats
  const totalSessions = displaySessions.length
  const totalInsights = displaySessions.reduce((acc, s) => {
    const insights = s.analysisResult?.executive_summary?.top_insights
    return acc + (Array.isArray(insights) ? insights.length : 0)
  }, 0)
  const pendingActions = displaySessions.reduce((acc, s) => {
    const actions = s.analysisResult?.executive_summary?.action_items
    return acc + (Array.isArray(actions) ? actions.length : 0)
  }, 0)

  // Progress animation during analysis
  useEffect(() => {
    if (!analyzing) {
      setAnalysisProgress(0)
      return
    }
    let current = 0
    const interval = setInterval(() => {
      current += Math.random() * 8
      if (current > 90) current = 90
      setAnalysisProgress(Math.min(current, 90))
    }, 600)
    return () => clearInterval(interval)
  }, [analyzing])

  // ---- HANDLERS ----

  const handleNewAnalysis = () => {
    setInterviewNotes('')
    setRoadmapContext('')
    setRoadmapOpen(false)
    setStatusMessage(null)
    setActiveSessionId(null)
    setScreen('analysis')
  }

  const handleAnalyze = async () => {
    if (!interviewNotes.trim()) {
      setStatusMessage({ type: 'warning', message: 'Please paste interview notes before analyzing.' })
      return
    }

    setAnalyzing(true)
    setStatusMessage(null)
    setActiveAgentId(MANAGER_AGENT_ID)

    let message = `Please analyze the following interview notes and extract findings, themes, and actionable insights:\n\n${interviewNotes.trim()}`
    if (roadmapContext.trim()) {
      message += `\n\nCurrent Product Roadmap Context:\n${roadmapContext.trim()}`
    }

    try {
      const result = await callAIAgent(message, MANAGER_AGENT_ID)
      setActiveAgentId(null)

      if (result.success) {
        const data = result?.response?.result as AnalysisResult | undefined
        setAnalysisProgress(100)

        const titleLine = interviewNotes.trim().split('\n')[0]?.slice(0, 60) ?? 'Untitled Session'
        const firstInsight = data?.executive_summary?.top_insights?.[0]?.insight
        const sessionTitle = firstInsight ? firstInsight.slice(0, 60) : titleLine

        const newSession: Session = {
          id: `session-${Date.now()}`,
          title: sessionTitle,
          date: new Date().toISOString(),
          notes: interviewNotes,
          roadmapContext,
          analysisResult: data ?? null,
          distributionResult: null,
          status: 'analyzed',
        }

        setSessions(prev => [newSession, ...prev])
        setActiveSessionId(newSession.id)
        setStatusMessage({ type: 'success', message: 'Analysis complete. Review your findings below.' })
        setScreen('results')
      } else {
        setStatusMessage({ type: 'error', message: result?.error ?? 'Analysis failed. Please try again.' })
      }
    } catch (err) {
      setActiveAgentId(null)
      setStatusMessage({ type: 'error', message: 'Network error during analysis. Please try again.' })
    }

    setAnalyzing(false)
  }

  const handleDistribute = async () => {
    if (!activeSession?.analysisResult) return

    const analysis = activeSession.analysisResult
    const narrative = analysis?.executive_summary?.executive_narrative ?? ''
    const insights = Array.isArray(analysis?.executive_summary?.top_insights) ? analysis.executive_summary.top_insights : []
    const actions = Array.isArray(analysis?.executive_summary?.action_items) ? analysis.executive_summary.action_items : []
    const urgentItems = Array.isArray(analysis?.executive_summary?.urgent_items) ? analysis.executive_summary.urgent_items : []

    let summaryBlock = `EXECUTIVE SUMMARY:\n${narrative}\n\nTOP INSIGHTS:\n`
    insights.forEach((ins) => {
      summaryBlock += `${ins?.rank ?? '-'}. [${(ins?.urgency ?? 'unknown').toUpperCase()}] ${ins?.insight ?? ''}\n`
    })
    summaryBlock += '\nACTION ITEMS:\n'
    actions.forEach((act, idx) => {
      summaryBlock += `${idx + 1}. ${act?.action ?? ''} (Impact: ${act?.impact_score ?? 'N/A'}, Effort: ${act?.effort_estimate ?? 'N/A'}, Alignment: ${act?.roadmap_alignment ?? 'N/A'})\n`
    })
    if (urgentItems.length > 0) {
      summaryBlock += '\nURGENT ITEMS:\n'
      urgentItems.forEach((u) => { summaryBlock += `- ${u}\n` })
    }

    let configBlock = 'DISTRIBUTION CONFIG:\n'
    if (distConfig.slackEnabled && distConfig.slackChannel) {
      configBlock += `- Slack Channel: ${distConfig.slackChannel}\n`
    }
    if (distConfig.gmailEnabled && distConfig.gmailRecipients) {
      configBlock += `- Gmail Recipients: ${distConfig.gmailRecipients}\n`
      configBlock += `- Gmail Subject: ${distConfig.gmailSubject || 'User Research Insights'}\n`
    }
    if (distConfig.notionEnabled && distConfig.notionParent) {
      configBlock += `- Notion Page Parent: ${distConfig.notionParent}\n`
    }
    if (distConfig.githubEnabled && distConfig.githubRepo) {
      configBlock += `- GitHub Repository: ${distConfig.githubRepo}\n`
      configBlock += `- GitHub Labels: ${distConfig.githubLabels || 'research-insight'}\n`
    }
    if (distConfig.calendarEnabled && distConfig.calendarDate) {
      configBlock += `- Calendar Event: Follow-up Review on ${distConfig.calendarDate}\n`
      if (distConfig.calendarAttendees) {
        configBlock += `- Calendar Attendees: ${distConfig.calendarAttendees}\n`
      }
    }

    const message = `Please distribute the following research summary to stakeholders:\n\nSUMMARY:\n${summaryBlock}\n\n${configBlock}`

    setDistributing(true)
    setDistributionDialogOpen(false)
    setActiveAgentId(DISTRIBUTION_AGENT_ID)
    setStatusMessage({ type: 'info', message: 'Distributing insights to stakeholders...' })

    try {
      const result = await callAIAgent(message, DISTRIBUTION_AGENT_ID)
      setActiveAgentId(null)

      if (result.success) {
        const distData = result?.response?.result as DistributionResult | undefined

        setSessions(prev => prev.map(s =>
          s.id === activeSessionId
            ? { ...s, distributionResult: distData ?? null, status: 'distributed' as const }
            : s
        ))
        if (sampleMode && activeSession) {
          // Update sample view reference
        }
        setStatusMessage({ type: 'success', message: distData?.summary_message ?? 'Insights distributed successfully.' })
      } else {
        setStatusMessage({ type: 'error', message: result?.error ?? 'Distribution failed. Please try again.' })
      }
    } catch {
      setActiveAgentId(null)
      setStatusMessage({ type: 'error', message: 'Network error during distribution.' })
    }

    setDistributing(false)
  }

  const openSession = (session: Session) => {
    setActiveSessionId(session.id)
    if (session.analysisResult) {
      setStatusMessage(null)
      setScreen('results')
    } else {
      setInterviewNotes(session.notes)
      setRoadmapContext(session.roadmapContext)
      setStatusMessage(null)
      setScreen('analysis')
    }
  }

  const handleDeleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    if (activeSessionId === sessionId) {
      setActiveSessionId(null)
      setScreen('dashboard')
    }
  }

  // Current session for results screen - need to re-derive after distribution updates
  const currentSession = (() => {
    if (sampleMode) {
      return SAMPLE_SESSIONS.find(s => s.id === activeSessionId) ?? null
    }
    return sessions.find(s => s.id === activeSessionId) ?? null
  })()

  // ---- NAV ITEMS ----
  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'analysis' as const, label: 'New Analysis', icon: <PenTool className="h-4 w-4" /> },
  ]

  return (
    <ErrorBoundary>
      <div style={THEME_VARS} className="min-h-screen bg-background text-foreground font-sans">
        {/* Gradient background layer */}
        <div className="fixed inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, hsl(210 20% 97%) 0%, hsl(220 25% 95%) 35%, hsl(200 20% 96%) 70%, hsl(230 15% 97%) 100%)' }} />

        <div className="relative flex min-h-screen">
          {/* ============ SIDEBAR ============ */}
          <aside className={cn("shrink-0 border-r border-border bg-white/60 backdrop-blur-[16px] transition-all duration-300 flex flex-col", sidebarOpen ? 'w-56' : 'w-14')}>
            {/* Logo */}
            <div className="p-4 flex items-center gap-3 border-b border-border">
              {sidebarOpen && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Eye className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-semibold text-sm tracking-tight">InsightLens</span>
                </div>
              )}
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto p-1 rounded-md hover:bg-muted transition-colors">
                {sidebarOpen ? <PanelLeftClose className="h-4 w-4 text-muted-foreground" /> : <PanelLeft className="h-4 w-4 text-muted-foreground" />}
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-2 space-y-1">
              {navItems.map((item) => (
                <button key={item.id} onClick={() => { setScreen(item.id); setStatusMessage(null) }} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", screen === item.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                  {item.icon}
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              ))}
              {currentSession?.analysisResult && (
                <button onClick={() => setScreen('results')} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", screen === 'results' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                  <BarChart3 className="h-4 w-4" />
                  {sidebarOpen && <span>Results</span>}
                </button>
              )}
            </nav>

            {/* Agent Status at bottom */}
            {sidebarOpen && (
              <div className="p-3 border-t border-border">
                <AgentStatusPanel activeAgentId={activeAgentId} />
              </div>
            )}
          </aside>

          {/* ============ MAIN CONTENT ============ */}
          <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
            {/* Header */}
            <header className="shrink-0 border-b border-border bg-white/60 backdrop-blur-[16px] px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold tracking-tight text-foreground">InsightLens</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground capitalize">{screen === 'results' ? 'Analysis Results' : screen}</span>
                {currentSession && screen === 'results' && (
                  <>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground truncate max-w-[200px]">{currentSession.title}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground">Sample Data</Label>
                  <Switch id="sample-toggle" checked={sampleMode} onCheckedChange={setSampleMode} />
                </div>
              </div>
            </header>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-6 max-w-6xl mx-auto w-full">

                {/* ============ DASHBOARD SCREEN ============ */}
                {screen === 'dashboard' && (
                  <div className="space-y-6">
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Research Dashboard</h1>
                        <p className="text-sm text-muted-foreground mt-1">Track and manage your user research sessions</p>
                      </div>
                      <Button onClick={handleNewAnalysis} className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Analysis
                      </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <StatCard icon={<FileText className="h-5 w-5 text-primary" />} label="Total Sessions" value={totalSessions} accent="bg-primary/10" />
                      <StatCard icon={<Lightbulb className="h-5 w-5 text-amber-600" />} label="Insights Extracted" value={totalInsights} accent="bg-amber-100" />
                      <StatCard icon={<Target className="h-5 w-5 text-blue-600" />} label="Action Items" value={pendingActions} accent="bg-blue-100" />
                    </div>

                    {/* Search & Filter */}
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search sessions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-white/75 backdrop-blur-[16px] border-white/[0.18]" />
                      </div>
                      <div className="flex items-center gap-1 border border-border rounded-lg p-1 bg-white/75 backdrop-blur-[16px]">
                        {['all', 'analyzed', 'distributed', 'draft'].map((f) => (
                          <button key={f} onClick={() => setFilterStatus(f)} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize", filterStatus === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}>
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sessions List */}
                    {filteredSessions.length === 0 ? (
                      <GlassCard className="p-12 text-center">
                        <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <h3 className="text-base font-medium text-foreground mb-1">
                          {sampleMode ? 'No matching sessions' : 'No research sessions yet'}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {sampleMode ? 'Try adjusting your search or filters.' : 'Start your first analysis by pasting interview notes.'}
                        </p>
                        {!sampleMode && (
                          <Button onClick={handleNewAnalysis} variant="outline" className="gap-2">
                            <Plus className="h-4 w-4" />
                            New Analysis
                          </Button>
                        )}
                      </GlassCard>
                    ) : (
                      <div className="space-y-3">
                        {filteredSessions.map((session) => {
                          const stBadge = getStatusBadge(session.status)
                          const insightCount = Array.isArray(session.analysisResult?.executive_summary?.top_insights) ? session.analysisResult.executive_summary.top_insights.length : 0
                          const preview = session.analysisResult?.parsed_findings?.summary ?? session.notes.slice(0, 120)
                          return (
                            <GlassCard key={session.id} className="p-4 cursor-pointer hover:shadow-lg transition-all duration-200 group">
                              <div className="flex items-start justify-between gap-4" onClick={() => openSession(session)}>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-sm font-semibold tracking-tight text-foreground truncate">{session.title}</h3>
                                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold", stBadge.color)}>
                                      {stBadge.label}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{preview}</p>
                                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(session.date)}</span>
                                    {insightCount > 0 && <span className="flex items-center gap-1"><Lightbulb className="h-3 w-3" />{insightCount} insights</span>}
                                  </div>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mt-1" />
                              </div>
                            </GlassCard>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ============ ANALYSIS SCREEN ============ */}
                {screen === 'analysis' && (
                  <div className="max-w-2xl mx-auto space-y-6">
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setScreen('dashboard'); setStatusMessage(null) }} className="p-2 rounded-lg hover:bg-muted transition-colors">
                        <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <div>
                        <h1 className="text-xl font-semibold tracking-tight">New Analysis</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">Paste your interview transcript to extract structured insights</p>
                      </div>
                    </div>

                    {statusMessage && <InlineStatus type={statusMessage.type} message={statusMessage.message} />}

                    <GlassCard className="p-6 space-y-5">
                      <div>
                        <Label htmlFor="notes" className="text-sm font-medium mb-2 block">Interview Notes</Label>
                        <Textarea id="notes" placeholder="Paste interview transcript or notes..." className="min-h-[240px] bg-white/50 border-border/50 leading-relaxed text-sm resize-y" value={interviewNotes} onChange={(e) => setInterviewNotes(e.target.value)} />
                        <p className="text-[10px] text-muted-foreground mt-1.5">{interviewNotes.length > 0 ? `${interviewNotes.split(/\s+/).filter(Boolean).length} words` : 'Supports raw transcripts, structured notes, or bullet points'}</p>
                      </div>

                      <Collapsible open={roadmapOpen} onOpenChange={setRoadmapOpen}>
                        <CollapsibleTrigger asChild>
                          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                            {roadmapOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            <span className="font-medium">Roadmap Context</span>
                            <span className="text-[10px]">(optional)</span>
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-3">
                            <Textarea placeholder="Enter current product priorities for cross-referencing..." className="min-h-[100px] bg-white/50 border-border/50 leading-relaxed text-sm resize-y" value={roadmapContext} onChange={(e) => setRoadmapContext(e.target.value)} />
                            <p className="text-[10px] text-muted-foreground mt-1.5">Helps align findings with your product roadmap</p>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      <Separator />

                      {analyzing && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span className="text-sm font-medium text-foreground">Analyzing with AI...</span>
                          </div>
                          <Progress value={analysisProgress} className="h-2" />
                          <p className="text-[10px] text-muted-foreground">Parsing findings, extracting themes, generating executive summary...</p>
                        </div>
                      )}

                      <Button onClick={handleAnalyze} disabled={analyzing || !interviewNotes.trim()} className="w-full gap-2" size="lg">
                        {analyzing ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
                        ) : (
                          <><Sparkles className="h-4 w-4" /> Analyze Interview</>
                        )}
                      </Button>
                    </GlassCard>

                    {analyzing && <LoadingSkeleton />}
                  </div>
                )}

                {/* ============ RESULTS SCREEN ============ */}
                {screen === 'results' && currentSession?.analysisResult && (() => {
                  const analysis = currentSession.analysisResult
                  const findings = Array.isArray(analysis?.parsed_findings?.findings) ? analysis.parsed_findings.findings : []
                  const themes = Array.isArray(analysis?.categorized_themes?.themes) ? analysis.categorized_themes.themes : []
                  const insights = Array.isArray(analysis?.executive_summary?.top_insights) ? analysis.executive_summary.top_insights : []
                  const actionItems = Array.isArray(analysis?.executive_summary?.action_items) ? analysis.executive_summary.action_items : []
                  const urgentItems = Array.isArray(analysis?.executive_summary?.urgent_items) ? analysis.executive_summary.urgent_items : []
                  const crossPatterns = Array.isArray(analysis?.categorized_themes?.cross_cutting_patterns) ? analysis.categorized_themes.cross_cutting_patterns : []
                  const narrative = analysis?.executive_summary?.executive_narrative ?? ''
                  const roadmapSummary = analysis?.executive_summary?.roadmap_alignment_summary ?? ''
                  const findingsSummary = analysis?.parsed_findings?.summary ?? ''
                  const distResult = currentSession.distributionResult

                  return (
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <button onClick={() => { setScreen('dashboard'); setStatusMessage(null) }} className="p-2 rounded-lg hover:bg-muted transition-colors">
                            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <div>
                            <h1 className="text-xl font-semibold tracking-tight">{currentSession.title}</h1>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">{formatDate(currentSession.date)}</span>
                              <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold", getStatusBadge(currentSession.status).color)}>
                                {getStatusBadge(currentSession.status).label}
                              </span>
                              {analysis?.analysis_status && (
                                <span className="text-[10px] text-muted-foreground">Status: {analysis.analysis_status}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button onClick={() => setDistributionDialogOpen(true)} disabled={distributing} className="gap-2" variant={currentSession.status === 'distributed' ? 'outline' : 'default'}>
                          {distributing ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Distributing...</>
                          ) : (
                            <><Share2 className="h-4 w-4" /> Distribute to Stakeholders</>
                          )}
                        </Button>
                      </div>

                      {statusMessage && <InlineStatus type={statusMessage.type} message={statusMessage.message} />}

                      {/* Urgent Items Banner */}
                      {urgentItems.length > 0 && (
                        <GlassCard className="p-4 border-l-4 border-l-red-500 bg-red-50/50">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-red-800 mb-1">Urgent Items</p>
                              {urgentItems.map((item, idx) => (
                                <p key={idx} className="text-xs text-red-700 leading-relaxed">{item}</p>
                              ))}
                            </div>
                          </div>
                        </GlassCard>
                      )}

                      {/* Executive Summary Card */}
                      <GlassCard className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Sparkles className="h-5 w-5 text-primary" />
                          <h2 className="text-base font-semibold tracking-tight">Executive Summary</h2>
                        </div>
                        {narrative && (
                          <div className="mb-5 text-sm text-foreground leading-relaxed">
                            {renderMarkdown(narrative)}
                          </div>
                        )}

                        {/* Top Insights */}
                        {insights.length > 0 && (
                          <div className="space-y-3 mt-4">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Top Insights</h3>
                            {insights.map((insight, idx) => (
                              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white/50 border border-border/50">
                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                  {insight?.rank ?? idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground leading-relaxed">{insight?.insight ?? ''}</p>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    {insight?.supporting_theme && (
                                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Layers className="h-3 w-3" />
                                        {insight.supporting_theme}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {insight?.urgency && (
                                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0", getUrgencyColor(insight.urgency))}>
                                    {(insight.urgency ?? '').toUpperCase()}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Roadmap Alignment */}
                        {roadmapSummary && (
                          <div className="mt-5 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Target className="h-3.5 w-3.5 text-blue-600" />
                              <span className="text-xs font-semibold text-blue-800">Roadmap Alignment</span>
                            </div>
                            <p className="text-xs text-blue-700 leading-relaxed">{roadmapSummary}</p>
                          </div>
                        )}
                      </GlassCard>

                      {/* Two Column Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* LEFT: Themes & Findings */}
                        <div className="space-y-4">
                          <GlassCard className="p-5">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-primary" />
                                <h2 className="text-sm font-semibold tracking-tight">Themes</h2>
                                <Badge variant="secondary" className="text-[10px]">{analysis?.categorized_themes?.total_themes ?? themes.length}</Badge>
                              </div>
                            </div>

                            {themes.length > 0 ? (
                              <Accordion type="multiple" className="space-y-0">
                                {themes.map((theme, idx) => {
                                  const relatedFindings = findings.filter(f => Array.isArray(theme?.supporting_findings) && theme.supporting_findings.includes(f?.id))
                                  return (
                                    <AccordionItem key={idx} value={`theme-${idx}`} className="border-b border-border/50">
                                      <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                                        <div className="flex items-center gap-2 text-left">
                                          <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold border", getCategoryColor(theme?.category ?? ''))}>{getCategoryLabel(theme?.category ?? '')}</span>
                                          <span className="text-sm">{theme?.theme_name ?? 'Untitled Theme'}</span>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent className="pb-4">
                                        <div className="space-y-3">
                                          {theme?.description && <p className="text-xs text-muted-foreground leading-relaxed">{theme.description}</p>}

                                          {/* Score badges */}
                                          <div className="flex flex-wrap gap-2">
                                            {typeof theme?.impact_score === 'number' && (
                                              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-primary/10 text-primary">Impact: {theme.impact_score}/10</span>
                                            )}
                                            {typeof theme?.frequency === 'number' && (
                                              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-secondary text-secondary-foreground">Frequency: {theme.frequency}</span>
                                            )}
                                            {typeof theme?.priority_score === 'number' && (
                                              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-800">Priority: {theme.priority_score}/10</span>
                                            )}
                                          </div>

                                          {/* Key quotes */}
                                          {Array.isArray(theme?.key_quotes) && theme.key_quotes.length > 0 && (
                                            <div className="space-y-1.5">
                                              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Key Quotes</p>
                                              {theme.key_quotes.map((q, qi) => (
                                                <div key={qi} className="flex items-start gap-2 pl-2 border-l-2 border-primary/20">
                                                  <Quote className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                                                  <p className="text-xs text-muted-foreground italic leading-relaxed">{q}</p>
                                                </div>
                                              ))}
                                            </div>
                                          )}

                                          {/* Related findings */}
                                          {relatedFindings.length > 0 && (
                                            <div className="space-y-1.5">
                                              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Supporting Findings</p>
                                              {relatedFindings.map((f, fi) => (
                                                <div key={fi} className="p-2 rounded bg-white/50 border border-border/30">
                                                  <div className="flex items-center gap-1.5 mb-1">
                                                    <span className={cn("inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold border", getCategoryColor(f?.category ?? ''))}>{getCategoryLabel(f?.category ?? '')}</span>
                                                    {f?.emotional_intensity && (
                                                      <span className={cn("text-[9px] font-medium", getIntensityColor(f.emotional_intensity))}>
                                                        {(f.emotional_intensity ?? '').toUpperCase()} intensity
                                                      </span>
                                                    )}
                                                  </div>
                                                  <p className="text-xs text-foreground leading-relaxed">{f?.description ?? ''}</p>
                                                  {f?.user_quote && (
                                                    <p className="text-[10px] text-muted-foreground italic mt-1 pl-2 border-l-2 border-muted">
                                                      &ldquo;{f.user_quote}&rdquo;
                                                    </p>
                                                  )}
                                                  {f?.implicit_need && (
                                                    <p className="text-[10px] text-blue-600 mt-1 flex items-center gap-1">
                                                      <Lightbulb className="h-3 w-3" />
                                                      {f.implicit_need}
                                                    </p>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </AccordionContent>
                                    </AccordionItem>
                                  )
                                })}
                              </Accordion>
                            ) : (
                              <p className="text-xs text-muted-foreground">No themes extracted.</p>
                            )}

                            {/* Cross-cutting patterns */}
                            {crossPatterns.length > 0 && (
                              <div className="mt-4 p-3 rounded-lg bg-purple-50/50 border border-purple-100">
                                <p className="text-[10px] font-semibold text-purple-800 uppercase mb-1.5">Cross-Cutting Patterns</p>
                                {crossPatterns.map((p, pi) => (
                                  <p key={pi} className="text-xs text-purple-700 leading-relaxed flex items-start gap-1.5">
                                    <TrendingUp className="h-3 w-3 shrink-0 mt-0.5" />{p}
                                  </p>
                                ))}
                              </div>
                            )}
                          </GlassCard>

                          {/* Findings Summary */}
                          {findingsSummary && (
                            <GlassCard className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-primary" />
                                <h3 className="text-xs font-semibold tracking-tight">Findings Summary</h3>
                                <Badge variant="secondary" className="text-[10px]">{analysis?.parsed_findings?.total_findings ?? findings.length} total</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">{findingsSummary}</p>
                            </GlassCard>
                          )}
                        </div>

                        {/* RIGHT: Action Items */}
                        <div className="space-y-4">
                          <GlassCard className="p-5">
                            <div className="flex items-center gap-2 mb-4">
                              <Target className="h-4 w-4 text-primary" />
                              <h2 className="text-sm font-semibold tracking-tight">Action Items</h2>
                              <Badge variant="secondary" className="text-[10px]">{actionItems.length}</Badge>
                            </div>

                            {actionItems.length > 0 ? (
                              <div className="space-y-3">
                                {actionItems.map((item, idx) => {
                                  const alignCfg = getAlignmentConfig(item?.roadmap_alignment ?? '')
                                  const effortCfg = getEffortConfig(item?.effort_estimate ?? '')
                                  return (
                                    <div key={idx} className="p-3 rounded-lg bg-white/50 border border-border/50 space-y-2">
                                      <div className="flex items-start gap-2">
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 mt-0.5">
                                          {idx + 1}
                                        </div>
                                        <p className="text-sm font-medium text-foreground leading-relaxed">{item?.action ?? ''}</p>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5 pl-8">
                                        {typeof item?.impact_score === 'number' && (
                                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                                            Impact: {item.impact_score}/10
                                          </span>
                                        )}
                                        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", effortCfg.color)}>
                                          {effortCfg.label}
                                        </span>
                                        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", alignCfg.color)}>
                                          {alignCfg.label}
                                        </span>
                                        {item?.assigned_to && (
                                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            {item.assigned_to}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">No action items generated.</p>
                            )}
                          </GlassCard>

                          {/* All Findings (expandable) */}
                          <GlassCard className="p-5">
                            <div className="flex items-center gap-2 mb-4">
                              <Search className="h-4 w-4 text-primary" />
                              <h2 className="text-sm font-semibold tracking-tight">All Findings</h2>
                              <Badge variant="secondary" className="text-[10px]">{findings.length}</Badge>
                            </div>
                            {findings.length > 0 ? (
                              <Accordion type="multiple" className="space-y-0">
                                {findings.map((finding, idx) => (
                                  <AccordionItem key={idx} value={`finding-${idx}`} className="border-b border-border/50">
                                    <AccordionTrigger className="text-xs font-medium hover:no-underline py-2.5">
                                      <div className="flex items-center gap-2 text-left">
                                        <span className={cn("inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold border", getCategoryColor(finding?.category ?? ''))}>
                                          {getCategoryLabel(finding?.category ?? '')}
                                        </span>
                                        <span className="truncate">{(finding?.description ?? '').slice(0, 60)}{(finding?.description?.length ?? 0) > 60 ? '...' : ''}</span>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <div className="space-y-2 py-1">
                                        <p className="text-xs text-foreground leading-relaxed">{finding?.description ?? ''}</p>
                                        {finding?.user_quote && (
                                          <div className="flex items-start gap-2 pl-2 border-l-2 border-primary/20">
                                            <Quote className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                                            <p className="text-xs text-muted-foreground italic">&ldquo;{finding.user_quote}&rdquo;</p>
                                          </div>
                                        )}
                                        <div className="flex flex-wrap gap-2">
                                          {finding?.emotional_intensity && (
                                            <span className={cn("text-[10px] font-medium", getIntensityColor(finding.emotional_intensity))}>
                                              {(finding.emotional_intensity ?? '').toUpperCase()} intensity
                                            </span>
                                          )}
                                          {finding?.implicit_need && (
                                            <span className="text-[10px] text-blue-600 flex items-center gap-1">
                                              <Lightbulb className="h-3 w-3" />{finding.implicit_need}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                ))}
                              </Accordion>
                            ) : (
                              <p className="text-xs text-muted-foreground">No findings available.</p>
                            )}
                          </GlassCard>

                          {/* Distribution Results */}
                          {distResult && (
                            <GlassCard className="p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <h2 className="text-sm font-semibold tracking-tight">Distribution Results</h2>
                              </div>
                              {distResult?.distribution_status && (
                                <p className="text-xs text-muted-foreground mb-3">Status: {distResult.distribution_status}</p>
                              )}
                              {Array.isArray(distResult?.channels) && distResult.channels.length > 0 && (
                                <div className="space-y-2 mb-3">
                                  {distResult.channels.map((ch, ci) => (
                                    <div key={ci} className="flex items-center justify-between p-2 rounded bg-white/50 border border-border/30">
                                      <div className="flex items-center gap-2">
                                        {ch?.channel_name?.toLowerCase()?.includes('slack') && <Hash className="h-3.5 w-3.5 text-purple-600" />}
                                        {ch?.channel_name?.toLowerCase()?.includes('gmail') && <Mail className="h-3.5 w-3.5 text-red-500" />}
                                        {ch?.channel_name?.toLowerCase()?.includes('notion') && <BookOpen className="h-3.5 w-3.5 text-gray-700" />}
                                        {ch?.channel_name?.toLowerCase()?.includes('github') && <Github className="h-3.5 w-3.5 text-gray-800" />}
                                        {ch?.channel_name?.toLowerCase()?.includes('calendar') && <Calendar className="h-3.5 w-3.5 text-blue-600" />}
                                        {!['slack', 'gmail', 'notion', 'github', 'calendar'].some(n => ch?.channel_name?.toLowerCase()?.includes(n)) && <Send className="h-3.5 w-3.5 text-muted-foreground" />}
                                        <div>
                                          <p className="text-xs font-medium">{ch?.channel_name ?? 'Unknown'}</p>
                                          {ch?.details && <p className="text-[10px] text-muted-foreground">{ch.details}</p>}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", ch?.status === 'sent' || ch?.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                                          {ch?.status ?? 'unknown'}
                                        </span>
                                        {ch?.link && (
                                          <a href={ch.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                            <ExternalLink className="h-3 w-3" />
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {typeof distResult?.github_issues_created === 'number' && distResult.github_issues_created > 0 && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Github className="h-3 w-3" />{distResult.github_issues_created} GitHub issue(s) created
                                </p>
                              )}
                              {distResult?.summary_message && (
                                <p className="text-xs text-foreground mt-2 font-medium">{distResult.summary_message}</p>
                              )}
                            </GlassCard>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Results screen with no data */}
                {screen === 'results' && !currentSession?.analysisResult && (
                  <div className="flex flex-col items-center justify-center py-20">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h2 className="text-lg font-semibold mb-1">No Analysis Data</h2>
                    <p className="text-sm text-muted-foreground mb-4">Select a session with analysis results or start a new analysis.</p>
                    <Button onClick={handleNewAnalysis} className="gap-2">
                      <Plus className="h-4 w-4" />
                      New Analysis
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </main>
        </div>

        {/* ============ DISTRIBUTION DIALOG ============ */}
        <Dialog open={distributionDialogOpen} onOpenChange={setDistributionDialogOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Distribute to Stakeholders
              </DialogTitle>
              <DialogDescription>
                Configure which channels to share the research insights through. The agent handles all integrations automatically.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* Slack */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-purple-600" />
                    <Label className="text-sm font-medium">Slack</Label>
                  </div>
                  <Switch checked={distConfig.slackEnabled} onCheckedChange={(v) => setDistConfig(prev => ({ ...prev, slackEnabled: v }))} />
                </div>
                {distConfig.slackEnabled && (
                  <Input placeholder="#product-research" value={distConfig.slackChannel} onChange={(e) => setDistConfig(prev => ({ ...prev, slackChannel: e.target.value }))} className="text-sm" />
                )}
              </div>

              <Separator />

              {/* Gmail */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-red-500" />
                    <Label className="text-sm font-medium">Gmail</Label>
                  </div>
                  <Switch checked={distConfig.gmailEnabled} onCheckedChange={(v) => setDistConfig(prev => ({ ...prev, gmailEnabled: v }))} />
                </div>
                {distConfig.gmailEnabled && (
                  <div className="space-y-2">
                    <Input placeholder="pm@company.com, eng@company.com" type="email" value={distConfig.gmailRecipients} onChange={(e) => setDistConfig(prev => ({ ...prev, gmailRecipients: e.target.value }))} className="text-sm" />
                    <Input placeholder="User Research Insights - Feb 2026" value={distConfig.gmailSubject} onChange={(e) => setDistConfig(prev => ({ ...prev, gmailSubject: e.target.value }))} className="text-sm" />
                  </div>
                )}
              </div>

              <Separator />

              {/* Notion */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-gray-700" />
                    <Label className="text-sm font-medium">Notion</Label>
                  </div>
                  <Switch checked={distConfig.notionEnabled} onCheckedChange={(v) => setDistConfig(prev => ({ ...prev, notionEnabled: v }))} />
                </div>
                {distConfig.notionEnabled && (
                  <Input placeholder="Research Hub" value={distConfig.notionParent} onChange={(e) => setDistConfig(prev => ({ ...prev, notionParent: e.target.value }))} className="text-sm" />
                )}
              </div>

              <Separator />

              {/* GitHub */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Github className="h-4 w-4 text-gray-800" />
                    <Label className="text-sm font-medium">GitHub Issues</Label>
                  </div>
                  <Switch checked={distConfig.githubEnabled} onCheckedChange={(v) => setDistConfig(prev => ({ ...prev, githubEnabled: v }))} />
                </div>
                {distConfig.githubEnabled && (
                  <div className="space-y-2">
                    <Input placeholder="owner/product-backlog" value={distConfig.githubRepo} onChange={(e) => setDistConfig(prev => ({ ...prev, githubRepo: e.target.value }))} className="text-sm" />
                    <Input placeholder="research-insight, ux" value={distConfig.githubLabels} onChange={(e) => setDistConfig(prev => ({ ...prev, githubLabels: e.target.value }))} className="text-sm" />
                  </div>
                )}
              </div>

              <Separator />

              {/* Google Calendar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <Label className="text-sm font-medium">Calendar Follow-up</Label>
                  </div>
                  <Switch checked={distConfig.calendarEnabled} onCheckedChange={(v) => setDistConfig(prev => ({ ...prev, calendarEnabled: v }))} />
                </div>
                {distConfig.calendarEnabled && (
                  <div className="space-y-2">
                    <Input type="datetime-local" value={distConfig.calendarDate} onChange={(e) => setDistConfig(prev => ({ ...prev, calendarDate: e.target.value }))} className="text-sm" />
                    <Input placeholder="pm@company.com, eng@company.com" value={distConfig.calendarAttendees} onChange={(e) => setDistConfig(prev => ({ ...prev, calendarAttendees: e.target.value }))} className="text-sm" />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDistributionDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleDistribute} disabled={distributing} className="gap-2">
                {distributing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="h-4 w-4" /> Distribute</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  )
}
