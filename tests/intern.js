const intern = require('intern').default;
const args = require('yargs').argv;
const firefoxProfile = require('./tools/firefox_profile');

// Tests
const testsMain = require('./functional');
const testsOAuth = require('./functional_oauth');
const testsCircleCi = require('./functional_circle');
const testsTravisCi = require('./functional_travis');
const testsServer = require('./tests_server');
const testsServerResources = require('./tests_server_resources');
const testsAll = testsMain.concat(testsOAuth);

const fxaAuthRoot = args.fxaAuthRoot || 'http://127.0.0.1:9000/v1';
const fxaContentRoot = args.fxaContentRoot || 'http://127.0.0.1:3030/';
const fxaOAuthRoot = args.fxaOAuthRoot || 'http://127.0.0.1:9010';
const fxaProfileRoot = args.fxaProfileRoot || 'http://127.0.0.1:1111';
const fxaTokenRoot = args.fxaTokenRoot || 'http://127.0.0.1:5000/token';
const fxaEmailRoot = args.fxaEmailRoot || 'http://127.0.0.1:9001';
const fxaOauthApp = args.fxaOauthApp || 'http://127.0.0.1:8080/';
const fxaUntrustedOauthApp = args.fxaUntrustedOauthApp || 'http://127.0.0.1:10139/';

// "fxaProduction" is a little overloaded in how it is used in the tests.
// Sometimes it means real "stage" or real production configuration, but
// sometimes it also means fxa-dev style boxes like "latest". Configuration
// parameter "fxaDevBox" can be used as a crude way to distinguish between
// two.
const fxaProduction = !! args.fxaProduction;
const fxaDevBox = !! args.fxaDevBox;

const fxaToken = args.fxaToken || 'http://';
const asyncTimeout = parseInt(args.asyncTimeout || 5000, 10);

// On Circle, we bail after the first failure.
// args.bailAfterFirstFailure comes in as a string.
const bailAfterFirstFailure = args.bailAfterFirstFailure === 'true';

// Intern specific options are here: https://theintern.io/docs.html#Intern/4/docs/docs%2Fconfiguration.md/properties
const config = {
  asyncTimeout: asyncTimeout,
  bail: bailAfterFirstFailure,
  defaultTimeout: 45000, // 30 seconds just isn't long enough for some tests.
  environments: {
    browserName: 'firefox',
  },
  filterErrorStack: true,
  functionalSuites: testsMain,

  fxaAuthRoot: fxaAuthRoot,
  fxaContentRoot: fxaContentRoot,
  fxaDevBox: fxaDevBox,
  fxaEmailRoot: fxaEmailRoot,
  fxaOAuthRoot: fxaOAuthRoot,
  fxaOauthApp: fxaOauthApp,
  fxaProduction: fxaProduction,
  fxaProfileRoot: fxaProfileRoot,
  fxaToken: fxaToken,
  fxaTokenRoot: fxaTokenRoot,
  fxaUntrustedOauthApp: fxaUntrustedOauthApp,

  pageLoadTimeout: 20000,
  serverPort: 9090,
  serverUrl: 'http://127.0.0.1:9090',
  reporters: 'runner',
  tunnelOptions: {
    'drivers': ['firefox']
  },
};

if (args.grep) {
  config.grep = new RegExp(args.grep, 'i');
}

if (args.suites) {
  switch(args.suites) {
    case 'oauth':
      config.functionalSuites = testsOAuth;
      break;
    case 'all':
      config.functionalSuites = testsAll;
      break;
    case 'circle':
      config.functionalSuites = testsCircleCi;
      console.log('Running tests:', config.functionalSuites);
      break;
    case 'travis':
      config.functionalSuites = testsTravisCi;
      break;
    case 'server':
      config.functionalSuites = [];
      config.node = {};
      config.node.suites = testsServer;
      config.tunnelOptions = {};
      config.environments = {
        browserName: 'node',
      };
      //config.reporters = 'pretty';
      console.log(config)
      break;
    case 'server-resources':
      config.functionalSuites = [];
      config.suites = testsServerResources;
      //config.reporters = 'pretty';
      break;
  }
}

if (args.useTeamCityReporter) {
  config.reporters = 'teamcity';
}

config.capabilities = {};
config.capabilities['moz:firefoxOptions'] = {};
// to create a profile, give it the `config` option.
config.capabilities['moz:firefoxOptions'].profile = firefoxProfile(config); //eslint-disable-line camelcase

// custom Firefox binary location, if specified then the default is ignored.
// ref: https://code.google.com/p/selenium/wiki/DesiredCapabilities#WebDriver
if (args.firefoxBinary) {
  config.capabilities['moz:firefoxOptions'].binary = args.firefoxBinary; //eslint-disable-line camelcase
}

intern.configure(config);
intern.run();
