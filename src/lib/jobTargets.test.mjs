import test from 'node:test'
import assert from 'node:assert/strict'
import { trackingRegion } from './jobTargets.mjs'

test('all company Singapore postings qualify, other Asian offices do not', () => {
  for (const company of ['GitHub', 'OpenAI', 'MongoDB', 'Databricks']) {
    assert.equal(trackingRegion(company, 'Singapore'), 'Singapore')
    assert.equal(trackingRegion(company, 'Bengaluru, India'), '')
    assert.equal(trackingRegion(company, 'Sydney, Australia'), '')
  }
})

test('Europe is restricted to GitHub and requires explicit location evidence', () => {
  for (const location of ['Remote, United Kingdom', 'Germany', 'Netherlands', 'France', 'Dublin', 'Europe']) {
    assert.equal(trackingRegion('GitHub', location), 'Europe')
    assert.equal(trackingRegion('GitLab', location), '')
  }
  for (const location of ['Remote', 'EMEA', 'United States', 'Canada', 'Australia', 'Georgia, United States', '']) {
    assert.equal(trackingRegion('GitHub', location), '')
  }
})

test('Singapore remains detectable beyond a display-truncated location list', () => {
  assert.equal(trackingRegion('OpenAI', 'San Francisco, United States; London, United Kingdom; Singapore'), 'Singapore')
})
