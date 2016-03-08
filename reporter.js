require('colors');
var util = require('util');

function MultiBrowserSummaryReporter(logger, config) {
  var _log = logger.create('report');
  var _tests = null;

  /* ======================================================================== */
  /* INTERNAL FUNCTIONS                                                       */
  /* ======================================================================== */

  function print() {
    process.stdout.write(util.format.apply(this, arguments));
    process.stdout.write('\n');
  }

  function forBrowser(browser) {
    /* onBrowserLog might arrive before onBrowserStart, sooo */
    if (_tests[browser.id]) return _tests[browser.id];
    _tests[browser.id] = {
      "name": browser.name,
      "successes": 0,
      "failures": 0,
      "skipped": 0,
      "total": 0,
      "suites": {},
      "log": []
    };
    return _tests[browser.id];
  }

  function message(result) {
    var responses = [];
    if (result.total > 0) {
      if (result.total == 1) {
        responses = [];
        if (result.successes) responses.push("ok".green);
        if (result.failures)  responses.push("failed".red);
        if (result.skipped)   responses.push("skipped".yellow);
        return responses.join(' ');
      } else {
        responses = [];
        if (result.successes) responses.push((result.successes + " ok").green);
        if (result.failures)  responses.push((result.failures  + " failed").red);
        if (result.skipped)   responses.push((result.skipped   + " skipped").yellow);
        return responses.join(', ');
      }
    } else {
      return "no tests".magenta;
    }
  }

  function report(tests, indent) {
    if (! tests) return false;

    indent = indent || '';
    var output = '';

    if (tests.result) {
      var results = Object.keys(tests.result);
      for (var i in results) {
        var result = tests.result[results[i]];
        if (config.verboseReporter.output === 'only-failure' && result != 'failure') continue;

        var line = result;

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
        }

        if (config.verboseReporter.color !== 'full') {
          line = [indent, '*', results[i], ':', line, '\n'].join(' ');
        }

        output += line;
      }
    }

    if (tests.suites) {
      var suites = Object.keys(tests.suites);

      for (var j in suites) {
        var suite_str = [indent, '-', suites[j].bold, ':', '\n'].join(' ');
        var test_report = report(tests.suites[suites[j]], '  ' + indent);

        if (test_report) {
          suite_str += test_report;
          output += suite_str;
        }
      }
    }

    return output;
  }

  /* ======================================================================== */
  /* RUN START/COMPLETE                                                       */
  /* ======================================================================== */

  this.onRunStart = function(browsers) {
    _tests = {};
  };

  this.onRunComplete = function(browsers, results) {
    var browser = null;

    if (_tests.length === 0) {
      print('\n\nNo results found.\n'.bold.underline);
    }
    else {
      suite_output = '';


      var logBrowser = function(entry) {
        log[entry.level](entry.message);
      };

      for (var i in _tests) {
        browser = _tests[i];
        var log = logger.create(browser.name);
        browser.log.forEach(logBrowser);
        browser.log = [];

        output = report(browser);

        if (output) {
          suite_output += ("\n" + browser.name + "\n").bold.underline + output;
        }
      }

      if (suite_output) {
        print("\n");
        if (config.verboseReporter.output === 'only-failure') {
          print('Test failures by browser:'.bold.underline);
        }
        else {
          print("Suites and tests results:".bold.underline);
        }
        print();
        print(suite_output);
      }

      print();
      print("Per browser summary:".bold.underline);
      print();

      for (var j in _tests) {
        browser = _tests[j];
        print(" - " + browser.name.bold + ": " + browser.total + " tests");
        print("   - " + message(browser));
      }
    }

    print();
  };

  this.onSpecComplete = function(browser, result) {
    var suite = '';
    var b = forBrowser(browser);
    var tests = b;

    for (var i in result.suite) {
      var suiteName = result.suite[i];
      suite += (', ' + suiteName);

      if (! tests.suites) tests.suites = {};
      if (! tests.suites[suiteName]) tests.suites[suiteName] = {};
      tests = tests.suites[suiteName];
    }

    suite = suite.length > 2 ? ' | ' + suite.substring(2) + ' | ' : ' | ';

    var log = logger.create(browser.name + suite + result.description);

    b.log.forEach(function(entry) {
      log[entry.level](entry.message);
    });
    b.log = [];

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

MultiBrowserSummaryReporter.$inject = ['logger', 'config'];
module.exports = {
  'reporter:multibrowser-summary': ['type', MultiBrowserSummaryReporter]
};
