Karma Multi-Browser Summary Reporter
====================================

A [Karma](https://github.com/karma-runner/karma) reporter meant to be used with large unit-test suites being run across multiple browsers concurrently. Other reporters have issues with either not breaking out each browser's results, or printing out so much information it can be hard to tell exactly what failed and in which browsers.

Initially based off of [karma-verbose-summary-reporter](https://github.com/pstanic/karma-verbose-summary-reporter). Many thanks to @pstanic for his clear and understandable code. I wouldn't have been able to work out how to make this without his work as a template.

## Installation

To install, add this line to your `package.json` file:

```
"karma-multibrowser-reporter": "git+ssh://git@github.com:Noirbot/karma-multibrowser-reporter.git"
```

Then run `npm install`. To add it to Karma, you'll need to set it as a reporter in your `karma.conf.js`.

```javascript
reporters: [
  'multibrowser-summary'
]
```

## Options

There are currently two supported options that you can add in your `karma.conf.js`:

```javascript
verboseReporter: {
  color: 'full',
  output: 'only-failure'
},
```

The `color` option defaults to only coloring the "result" portion of the line, and not the name of the test. If `color` is set to `full`, it will color the whole line in the appropriate color, red for failure, green for passing, yellow for skipped.

The `output` option defaults to printing the results of every test, but if that's too verbose, you can set it to `only-failure` to have it only print the information of the tests that failed. Either option will still print out the aggregated summary of all the tests run.
