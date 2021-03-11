const webpack = require('webpack')
const webpackConfig = require('../../webpack.base')({ mode: 'development', types: ['jasmine'] })
const getTestReportDirectory = require('../getTestReportDirectory')
const jasmineSeedReporterPlugin = require('./jasmineSeedReporterPlugin')
const metricsPlugin = require('./metricsPlugin')

const reporters = ['spec', 'jasmine-seed', 'metrics']

const testReportDirectory = getTestReportDirectory()
if (testReportDirectory) {
  reporters.push('junit')
}

module.exports = {
  basePath: '../..',
  files: ['packages/*/+(src|test)/**/*.spec.ts'],
  frameworks: ['jasmine'],
  client: {
    jasmine: {
      random: true,
      oneFailurePerSpec: true,
    },
  },
  preprocessors: {
    'packages/*/+(src|test)/**/*.ts': ['webpack', 'sourcemap'],
  },
  reporters,
  specReporter: {
    suppressErrorSummary: true,
    suppressPassed: true,
    suppressSkipped: true,
  },
  junitReporter: {
    outputDir: testReportDirectory,
  },
  singleRun: true,
  webpack: {
    stats: 'minimal',
    module: webpackConfig.module,
    resolve: webpackConfig.resolve,
    devtool: false,
    mode: 'development',
    plugins: [
      new webpack.SourceMapDevToolPlugin({
        test: /\.(ts|js)($|\?)/i,
      }),
    ],
  },
  webpackMiddleware: {
    stats: 'errors-only',
    logLevel: 'warn',
  },
  plugins: ['karma-*', jasmineSeedReporterPlugin, metricsPlugin],
}
