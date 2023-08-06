'use strict';

const fs = require('fs');
const path = require('path');

module.exports = {
  isDirectory,
  isFile,
  getDirectories,
  getFiles,
  getFileStat,
  copyDirSync
}

/**
 * Check if input path is a directory.
 * @param {string} _path - The input path.
 * @returns {boolean}
 */
function isDirectory(_path) {
  return fs.lstatSync(_path).isDirectory();
}

/**
 * Check if input path is a file.
 * @param {string} _path - The input path.
 * @returns {boolean}
 */
function isFile(_path) {
  return fs.lstatSync(_path).isFile();
}

/**
 * Get directory names in a directory.
 * @param {string} dir - A directory.
 * @param {RegExp} re - A regular expression object.
 * @returns {string[]} An array of directory names.
 */
function getDirectories(dir, re = new RegExp(`^[^]`)) {
  if (typeof dir === 'undefined' || !fs.existsSync(dir) || isFile(dir)) {
    return [];
  } else {
    const absoluteDir = path.resolve(dir);
    return fs.readdirSync(absoluteDir)
      .map((name) => path.join(absoluteDir, name))
      .filter(isDirectory)
      .filter(name => re.test(name));
  }
}

/**
 * Get file names in a directory.
 * @param {string} dir - A directory.
 * @param {RegExp} re - A regular expression object.
 * @returns {string[]} An array of file names.
 */
function getFiles(dir, re = new RegExp(`^[^]`)) {
  if (typeof dir === 'undefined' || !fs.existsSync(dir) || isFile(dir)) {
    return [];
  } else {
    const absoluteDir = path.resolve(dir);
    return fs.readdirSync(absoluteDir)
      .map((name) => path.join(absoluteDir, name))
      .filter(isFile)
      .filter(name => re.test(name));
  }
}

/**
 * Get status of a path.
 * @param {string} _path - The path.
 * @returns {Promise<fs.Stats>}
 */
async function getFileStat(_path) {
  return new Promise((resolve, reject) => {
    fs.stat(_path, (err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats);
      }
    });
  });
}

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  var files = fs.readdirSync(src);
  for (let i = 0; i < files.length; ++i) {
    let file = fs.lstatSync(path.join(src, files[i]));
    if (file.isDirectory()) {
      copyDirSync(path.join(src, files[i]), path.join(dest, files[i]));
    } else if (file.isSymbolicLink()) {
      let symlink = fs.readlinkSync(path.join(src, files[i]));
      fs.symlinkSync(symlink, path.join(dest, files[i]));
    } else {
      fs.copyFileSync(path.join(src, files[i]), path.join(dest, files[i]));
    }
  }
};
