'use strict';

const assert = require('assert');
const shell = require('child_process');
const fs = require('fs');
const path = require('path');
const {
  isDirectory,
  isFile,
  getDirectories,
  getFiles,
  getFileStat,
  copyDirSync
} = require('../lib/fsutil');

function isEmptyArray(arr) {
  assert.strictEqual(typeof arr, 'object', 'Expected type to be object');
  assert.strictEqual(arr.length, 0, 'Expected length to be 0');
}

describe('getDirectories', () => {
  it('should return directories inside input path', function (done) {
    let dirs = getDirectories(path.join(__dirname, '../node_modules/mocha'));
    for (let i = 0; i < dirs.length; i += 1) {
      const isDir = fs.lstatSync(dirs[i]).isDirectory();
      assert.strictEqual(isDir, true, 'Expected path to be a folder');
    }
    done();
  })
  it(`should return an empty array when input is empty`, function (done) {
    let dirs = getDirectories();
    isEmptyArray(dirs);
    done();
  })
  it(`should return an empty array when input path does not exist`, function (done) {
    let dirs = getDirectories('./nonexist');
    isEmptyArray(dirs);
    done();
  })
  it(`should return an empty array when input path is a file`, function (done) {
    let dirs = getDirectories(path.join(__dirname, '../package.json'));
    isEmptyArray(dirs);
    done();
  })
});

describe('getFiles', () => {
  it('should return files inside input path', function (done) {
    let dirs = getFiles(path.join(__dirname, '../node_modules/mocha'));
    for (let i = 0; i < dirs.length; i += 1) {
      const isFile = fs.lstatSync(dirs[i]).isFile();
      assert.strictEqual(isFile, true, 'Expected path to be a file');
    }
    done();
  })
  it(`should return an empty array when input is empty`, function (done) {
    let files = getFiles();
    isEmptyArray(files);
    done();
  })
  it(`should return an empty array when input path does not exist`, function (done) {
    let files = getFiles('./nonexist');
    isEmptyArray(files);
    done();
  })
  it(`should return an empty array when input path is a file`, function (done) {
    let files = getFiles(path.join(__dirname, '../package.json'));
    isEmptyArray(files);
    done();
  })
});

describe('getFileStat', () => {
  it('should return status of input path', async function () {
    let file = path.join(__dirname, '../package.json');
    let stats = await getFileStat(file);
    let answer = fs.statSync(file);
    let keys = Object.keys(answer);
    return new Promise((resolve, reject) => {
      for (let i = 0; i < keys.length; ++i) {
        let key = keys[i];
        if (!stats.hasOwnProperty(key)) reject(new Error(`Property ${key} is not defined in returned object.`));
      }
      resolve();
    });
  })
});

describe('copyDirSync', () => {
  it('should copy ./ to /tmp/test', (done) => {
    copyDirSync(__dirname, '/tmp/test')
    assert(fs.existsSync('/tmp/test'))
    shell.exec('rm -rf /tmp/test', () => {})
    done()
  })
})