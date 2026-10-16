// list_issues filter parsing (zod schema) over the compiled dist/.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import schemas from '../../dist/schemas.js'

const { ListIssuesSchema } = schemas

test('ListIssuesSchema: only project → default limit, no filters', () => {
  assert.deepEqual(ListIssuesSchema.parse({ projectIdentifier: 'PROJ' }), { projectIdentifier: 'PROJ', limit: 50 })
})

test('ListIssuesSchema: status, priority and limit are kept', () => {
  const args = { projectIdentifier: 'PROJ', status: 'In Progress', priority: 'Urgent', limit: 10 }
  assert.deepEqual(ListIssuesSchema.parse(args), args)
})

test('ListIssuesSchema: unknown priority is rejected', () => {
  assert.equal(ListIssuesSchema.safeParse({ projectIdentifier: 'PROJ', priority: 'Critical' }).success, false)
})

test('ListIssuesSchema: limit bounds 1..250, integer', () => {
  for (const limit of [0, 251, 1.5]) {
    assert.equal(ListIssuesSchema.safeParse({ projectIdentifier: 'PROJ', limit }).success, false, `limit=${limit}`)
  }
  assert.equal(ListIssuesSchema.safeParse({ projectIdentifier: 'PROJ', limit: 250 }).success, true)
})

test('ListIssuesSchema: projectIdentifier is required', () => {
  assert.equal(ListIssuesSchema.safeParse({}).success, false)
})
