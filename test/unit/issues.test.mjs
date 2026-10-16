import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const connection = require('../../dist/connection.js')
const { listIssues } = require('../../dist/tools/issues.js')
const { ListIssuesSchema } = require('../../dist/schemas.js')
const { default: tracker, IssuePriority } = require('@hcengineering/tracker')
const { default: tags } = require('@hcengineering/tags')

function fixture(t, { labelExists = true, refs = [] } = {}) {
  const issues = Array.from({ length: 60 }, (_, i) => ({
    _id: `issue-${i}`, space: 'project', identifier: `PROJ-${i}`,
    title: `Issue ${i}`, status: 'active', priority: IssuePriority.High,
    modifiedOn: 60 - i
  }))
  issues.push({ ...issues[59], _id: 'other', space: 'other-project', identifier: 'OTHER-1' })
  const client = {
    async findOne(cls, query) {
      if (cls === tracker.class.Project) return { _id: 'project' }
      if (cls === tags.class.TagElement) return labelExists ? { _id: 'label' } : undefined
      if (cls === tracker.class.IssueStatus) return { _id: query.name === 'Done' ? 'done' : 'active', name: query.name }
      assert.fail(`Unexpected class ${cls}`)
    },
    async findAll(cls, query, options) {
      if (cls === tags.class.TagReference) {
        return refs.filter(ref => query.title !== undefined
          ? ref.title === query.title
          : query.attachedTo.$in.includes(ref.attachedTo))
      }
      if (cls === tracker.class.IssueStatus) return [{ _id: 'active', name: 'In Progress' }]
      if (cls === tracker.class.Issue) {
        return issues.filter(issue => Object.entries(query).every(([key, value]) =>
          key === '_id' ? value.$in.includes(issue._id) : issue[key] === value
        )).sort((a, b) => b.modifiedOn - a.modifiedOn).slice(0, options.limit)
      }
      assert.fail(`Unexpected class ${cls}`)
    }
  }
  mock.method(connection, 'getConnection', async () => client)
  t.after(() => mock.restoreAll())
  return async args => (await listIssues(ListIssuesSchema.parse({ projectIdentifier: 'PROJ', ...args }))).content[0].text
}

test('label filtering precedes limit and combines with project, status and priority', async t => {
  const run = fixture(t, { refs: ['issue-55', 'issue-59', 'other'].map(attachedTo => ({ attachedTo, title: 'Bug' })) })
  const result = await run({ label: 'Bug', status: 'In Progress', priority: 'High' })
  assert.match(result, /PROJ-55/)
  assert.match(result, /PROJ-59/)
  assert.doesNotMatch(result, /OTHER-1/)
  const limited = await run({ label: 'Bug', limit: 1 })
  assert.match(limited, /PROJ-55/)
  assert.doesNotMatch(limited, /PROJ-59/)
  assert.match(await run({ label: 'Bug', priority: 'Low' }), /^No issues found/)
  assert.match(await run({ label: 'Bug', status: 'Done' }), /^No issues found/)
})

test('unknown label reports an error', async t => {
  const run = fixture(t, { labelExists: false })
  await assert.rejects(run({ label: 'Missing' }), { message: "Huly MCP: Label 'Missing' not found." })
})

test('existing unused label returns ordinary empty results', async t => {
  const run = fixture(t)
  assert.equal(await run({ label: 'Unused' }), 'No issues found in project PROJ.')
})

test('omitting label retains the default limit and listing', async t => {
  const run = fixture(t)
  const result = await run({})
  assert.match(result, /Issues in PROJ \(50\)/)
  assert.match(result, /PROJ-49/)
  assert.doesNotMatch(result, /PROJ-55/)
})
