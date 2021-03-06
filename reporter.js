var chalk = require('chalk');
var failureFmt = chalk.red;
var successFmt = chalk.green;
var skipFmt = chalk.yellow;
var emphasisFmt = chalk.bold.underline;

function MultiBrowserSummaryReporter(config) {
  /*
   * _tests serves as the primary datastore for test results.
   */
  var _tests = {};

  /*
   * Check if we already know about this browser.
   *  - If we do, return what we have alread.
   *  - If it's a new browser, set up the data structure for it, then return it.
   */
  function getBrowserSafely(browser) {
    if (_tests[browser.id]) return _tests[browser.id];
    _tests[browser.id] = {
      name: browser.name,
      successes: 0,
      failures: 0,
      skipped: 0,
      total: 0,
      suites: {},
      log: []
    };
    return _tests[browser.id];
  }

  /*
   * Generate a text summary of all of the tests run, split by browsers.
   */
  function generateSummaryOutput(result) {
    var responses = [];
    var delimiter = '';
    if (result.total > 0) {
      if (result.total === 1) {
        responses = [];
        if (result.successes) responses.push(successFmt('ok'));
        if (result.failures) responses.push(failureFmt('failed'));
        if (result.skipped) responses.push(skipFmt('skipped'));
        delimiter = ' ';
      } else {
        responses = [];
        if (result.successes) responses.push(successFmt(result.successes + ' ok'));
        if (result.failures) responses.push(failureFmt(result.failures + ' failed'));
        if (result.skipped) responses.push(skipFmt(result.skipped + ' skipped'));
        delimiter = ', ';
      }
      return responses.join(delimiter);
    }

    return chalk.magenta('no tests');
  }

  /*
   * Generate a verbose summary of tests run, and their results.
   * Recursively calls itself with levels of indention changed.
   */
  function generateTestResultOutput(tests, baseIndent) {
    var indent = baseIndent || '';
    var output = '';
    var results;
    var suites;
    var line;

    if (tests) {
      if (tests.result) results = Object.keys(tests.result);
      if (tests.suites) suites = Object.keys(tests.suites);
    } else {
      return false;
    }

    if (results) {
      for (var i in results) {
        var result = tests.result[results[i]];
        if (config.verboseReporter.output === 'only-failure' && result !== 'failure') continue;

        line = result;

        if (config.verboseReporter.color === 'full') {
          line = [indent, '*', results[i], ':', result, '\n'].join(' ');
        }

        switch (result) {
          case 'success':
            line = successFmt(line);
            break;
          case 'failure':
            line = failureFmt(line);
            break;
          case 'skipped':
            line = skipFmt(line);
            break;
          default:
            break;
        }

        if (config.verboseReporter.color !== 'full') {
          line = [indent, '*', results[i], ':', line, '\n'].join(' ');
        }

        output += line;
      }
    }

    if (suites) {
      for (var j in suites) {
        var suiteStr = [indent, '-', chalk.bold(suites[j]), ':', '\n'].join(' ');
        var testReport = generateTestResultOutput(tests.suites[suites[j]], '  ' + indent);

        if (testReport) {
          suiteStr += testReport;
          output += suiteStr;
        }
      }
    }

    return output;
  }

  /*
   * When the run of tests completes, we need to log the results.
   * Reads from the _tests object and iteratively prints the data.
   */
  this.onRunComplete = function runComplete() {
    var browser = null;
    var suiteOutput;
    var output;

    if (_tests.length === 0) {
      process.stdout.write(emphasisFmt('\n\nNo results found.\n'));
    } else {
      suiteOutput = '';

      for (var i in _tests) {
        browser = _tests[i];

        output = generateTestResultOutput(browser);

        if (output) {
          suiteOutput += emphasisFmt('\n' + browser.name + '\n') + output;
        }
      }

      if (suiteOutput) {
        process.stdout.write('\n');
        if (config.verboseReporter.output === 'only-failure') {
          process.stdout.write(emphasisFmt('Test failures by browser:\n'));
        } else {
          process.stdout.write(emphasisFmt('Suites and tests results:\n'));
        }
        process.stdout.write(suiteOutput);
      }

      process.stdout.write(emphasisFmt('\nPer browser summary:\n\n'));

      for (var j in _tests) {
        browser = _tests[j];
        process.stdout.write(' - ' + chalk.bold(browser.name) + ': ' + browser.total + ' tests\n');
        process.stdout.write('   - ' + generateSummaryOutput(browser) + '\n');
      }
    }
    process.stdout.write('\n');
  };

  /*
   * When each test spec completes, we need to store it's result.
   * Uses the global _tests object to store the results.
   */
  this.onSpecComplete = function specComplete(browser, result) {
    var suite = '';
    var b = getBrowserSafely(browser);
    var tests = b;

    for (var i in result.suite) {
      var suiteName = result.suite[i];
      suite += (', ' + suiteName);

      if (! tests.suites) tests.suites = {};
      if (! tests.suites[suiteName]) tests.suites[suiteName] = {};
      tests = tests.suites[suiteName];
    }

    suite = suite.length > 2 ? ' | ' + suite.substring(2) + ' | ' : ' | ';

    if (! tests.result) tests.result = {};
    if (! tests.result[result.description]) tests.result[result.description] = null;

    b.total ++;

    if (result.skipped) {
      b.skipped ++;
      tests.result[result.description] = 'skipped';
    } else if (result.success) {
      b.successes ++;
      tests.result[result.description] = 'success';
    } else {
      b.failures ++;
      tests.result[result.description] = 'failure';
    }
  };
}

/*
 * Configure dependencies and exports from this module.
 */
MultiBrowserSummaryReporter.$inject = ['config'];
module.exports = {
  'reporter:multibrowser-summary': ['type', MultiBrowserSummaryReporter]
};
