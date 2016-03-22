require('colors');

function MultiBrowserSummaryReporter(config) {
  var _tests = null;

  /* ======================================================================== */
  /* INTERNAL FUNCTIONS                                                       */
  /* ======================================================================== */

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
        if (result.successes) responses.push('ok'.green);
        if (result.failures) responses.push('failed'.red);
        if (result.skipped) responses.push('skipped'.yellow);
        delimiter = ' ';
      } else {
        responses = [];
        if (result.successes) responses.push((result.successes + ' ok').green);
        if (result.failures) responses.push((result.failures + ' failed').red);
        if (result.skipped) responses.push((result.skipped + ' skipped').yellow);
        delimiter = ', ';
      }
      return responses.join(delimiter);
    }

    return 'no tests'.magenta;
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
            line = line.green;
            break;
          case 'failure':
            line = line.red;
            break;
          case 'skipped':
            line = line.yellow;
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
        var suiteStr = [indent, '-', suites[j].bold, ':', '\n'].join(' ');
        var testReport = generateTestResultOutput(tests.suites[suites[j]], '  ' + indent);

        if (testReport) {
          suiteStr += testReport;
          output += suiteStr;
        }
      }
    }

    return output;
  }

  /* ======================================================================== */
  /* RUN START/COMPLETE                                                       */
  /* ======================================================================== */

  this.onRunStart = function runStart() {
    _tests = {};
  };

  this.onRunComplete = function runComplete() {
    var browser = null;
    var suiteOutput;
    var output;

    if (_tests.length === 0) {
      process.stdout.write('\n\nNo results found.\n'.bold.underline);
    } else {
      suiteOutput = '';

      for (var i in _tests) {
        browser = _tests[i];

        output = generateTestResultOutput(browser);

        if (output) {
          suiteOutput += ('\n' + browser.name + '\n').bold.underline + output;
        }
      }

      if (suiteOutput) {
        process.stdout.write('\n');
        if (config.verboseReporter.output === 'only-failure') {
          process.stdout.write('Test failures by browser:\n'.bold.underline);
        } else {
          process.stdout.write('Suites and tests results:\n'.bold.underline);
        }
        process.stdout.write('\n' + suiteOutput + '\n');
      }

      process.stdout.write('\nPer browser summary:\n\n'.bold.underline);

      for (var j in _tests) {
        browser = _tests[j];
        process.stdout.write(' - ' + browser.name.bold + ': ' + browser.total + ' tests\n');
        process.stdout.write('   - ' + generateSummaryOutput(browser) + '\n');
      }
    }
    process.stdout.write('\n');
  };

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

  this.adapters = [];
}

/* ========================================================================== */
/* MODULE DECLARATION                                                         */
/* ========================================================================== */

MultiBrowserSummaryReporter.$inject = ['config'];
module.exports = {
  'reporter:multibrowser-summary': ['type', MultiBrowserSummaryReporter]
};
