'use strict';

const { test } = require('zora')
const { Logger, RET_SUCCESS, RET_FAIL } = require('../lib')

const logStr = 'Node.js is awesome!';
const logObj = {
  foo: 'bar',
  fooObj: {
    name: "john"
  },
  fooArr: [
    "apple", "orange"
  ]
};

test('Correctly compose log header', t => {
  const log = new Logger('Test')
  const h = log._makeHeader('X')
  t.equal(/^X\/Test\(\d+T\d+.\d+\):/.test(h), true, 'Header should\
 look like "X/Test(20191028T185730.780):"')
})

test('Default log level should be "warn"', t => {
  const log = new Logger('Test')
  t.equal(log.verbose(logStr), RET_FAIL, 'should return RET_FAIL')
  t.equal(log.debug(logStr), RET_FAIL, 'should return RET_FAIL')
  t.equal(log.info(logStr), RET_FAIL, 'should return RET_FAIL')
  t.equal(log.warn(logStr), RET_SUCCESS, 'should return RET_SUCCESS')
  t.equal(log.error(logStr), RET_SUCCESS, 'should return RET_SUCCESS')
})

test('Set log level to "verbose"', t => {
  const log = new Logger('Test')
  log.setLogLevel('verbose')
  t.equal(log.setLogLevel('verbose'), RET_SUCCESS, 'should return RET_SUCCESS')
  t.equal(log.verbose(logStr), RET_SUCCESS, 'should return RET_SUCCESS')
  t.equal(log.debug(logStr), RET_SUCCESS, 'should return RET_SUCCESS')
  t.equal(log.info(logStr), RET_SUCCESS, 'should return RET_SUCCESS')
  t.equal(log.warn(logStr), RET_SUCCESS, 'should return RET_SUCCESS')
  t.equal(log.error(logStr), RET_SUCCESS, 'should return RET_SUCCESS')
})

test('Disable color', t => {
  const log = new Logger('Test', { useColor: false })
  const h = log._makeHeader('X', '\x1b[35m')
  t.equal(h.indexOf('\x1b[35m'), -1, 'Header shouldn\'t contain color string')
})