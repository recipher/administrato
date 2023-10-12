import { configure, processCLIArgs, run } from '@japa/runner'
import { assert } from '@japa/assert'
import { apiClient } from '@japa/api-client'
import { browserClient } from '@japa/browser-client'

processCLIArgs(process.argv.splice(2))
configure({
  suites: [
    {
      name: 'browser',
      timeout: 30 * 1000,
      files: ['tests/browser/**/*.spec.mjs'],
    },
    {
      name: 'unit',
      files: ['tests/unit/**/*.spec.mjs'],
    }
  ],
  plugins: [
    assert(),
    apiClient('http://localhost:3333'),
    browserClient({ runInSuites: ['browser'] }),
  ],
})

run()