import { IssuePriority } from '@hcengineering/tracker'

export const PRIORITY_LABELS: Record<number, string> = {
  [IssuePriority.NoPriority]: 'No Priority',
  [IssuePriority.Urgent]: 'Urgent',
  [IssuePriority.High]: 'High',
  [IssuePriority.Medium]: 'Medium',
  [IssuePriority.Low]: 'Low'
}

export const MILESTONE_STATUS_LABELS: Record<number, string> = {
  0: 'Planned',
  1: 'In Progress',
  2: 'Completed',
  3: 'Canceled'
}

export function formatDate (ts: number | null | undefined): string {
  if (ts == null) return 'None'
  return new Date(ts).toISOString().split('T')[0]
}

export function priorityLabel (priority: number): string {
  return PRIORITY_LABELS[priority] ?? 'Unknown'
}

export function formatLabels (titles: string[]): string {
  if (titles.length === 0) return 'None'
  return [...titles].sort((a, b) => a.localeCompare(b)).join(', ')
}

export interface IssueLineInput {
  identifier: string
  statusName: string
  priority: number
  title: string
  dueDate?: number | null
  labels?: string[]
}

export function formatIssueLine (issue: IssueLineInput): string {
  const labels = issue.labels != null && issue.labels.length > 0 ? ` {${formatLabels(issue.labels)}}` : ''
  const due = issue.dueDate != null ? ` | Due: ${formatDate(issue.dueDate)}` : ''
  return `- **${issue.identifier}** [${issue.statusName}] [${priorityLabel(issue.priority)}]${labels}${due}\n  ${issue.title}`
}
