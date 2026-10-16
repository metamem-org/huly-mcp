// Unit tests over the compiled dist/ — run `npm run build` first (npm test does it).
// No network, no HULY_* env: only pure helpers are imported.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import format from '../../dist/utils/format.js'

const { formatLabels, formatIssueLine } = format

test('formatLabels: empty list → None', () => {
  assert.equal(formatLabels([]), 'None')
})

test('formatLabels: single label', () => {
  assert.equal(formatLabels(['bug']), 'bug')
})

test('formatLabels: several labels are sorted and comma-joined', () => {
  assert.equal(formatLabels(['ui', 'backend', 'docs']), 'backend, docs, ui')
})

test('formatLabels: does not mutate the input', () => {
  const input = ['b', 'a']
  formatLabels(input)
  assert.deepEqual(input, ['b', 'a'])
})

test('formatLabels: cyrillic and unicode', () => {
  assert.equal(formatLabels(['срочно', 'баг', 'архив']), 'архив, баг, срочно')
  assert.equal(formatLabels(['ёлка', 'еда']), 'еда, ёлка')
  assert.equal(formatLabels(['🔥 hot', 'Émoji', 'zeta']), formatLabels(['zeta', 'Émoji', '🔥 hot']))
})

const base = { identifier: 'PROJ-1', statusName: 'Todo', priority: 2, title: 'Fix login' }

test('formatIssueLine: without labels and due date', () => {
  assert.equal(formatIssueLine(base), '- **PROJ-1** [Todo] [High]\n  Fix login')
})

test('formatIssueLine: empty labels list adds nothing', () => {
  assert.equal(formatIssueLine({ ...base, labels: [] }), '- **PROJ-1** [Todo] [High]\n  Fix login')
})

test('formatIssueLine: with labels (sorted)', () => {
  assert.equal(
    formatIssueLine({ ...base, labels: ['ui', 'баг'] }),
    '- **PROJ-1** [Todo] [High] {ui, баг}\n  Fix login'
  )
})

test('formatIssueLine: due date without labels is byte-identical to the old format', () => {
  assert.equal(
    formatIssueLine({ ...base, dueDate: Date.UTC(2026, 9, 16) }),
    '- **PROJ-1** [Todo] [High] | Due: 2026-10-16\n  Fix login'
  )
})

test('formatIssueLine: labels go before due date', () => {
  assert.equal(
    formatIssueLine({ identifier: 'LAB-1', statusName: 'Todo', priority: 2, title: 'Night run', dueDate: Date.UTC(2026, 9, 16), labels: ['night', 'hermes'] }),
    '- **LAB-1** [Todo] [High] {hermes, night} | Due: 2026-10-16\n  Night run'
  )
})

test('formatIssueLine: unknown priority', () => {
  assert.match(formatIssueLine({ ...base, priority: 99 }), /\[Unknown\]/)
})
