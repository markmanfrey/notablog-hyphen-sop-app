'use strict'

/** Return Values */
const RET_SUCCESS = 0;
const RET_FAIL = -1;

/** Log Levels */
const LOG_LEVEL = {
  verbose: 2,
  debug: 3,
  info: 4,
  warn: 5,
  error: 6
}

const LOG_LEVEL_DEFAULT = LOG_LEVEL.warn

/** Color Styles */
const STYLE = {
  fgBlack: '\x1b[30m',
  fgRed: '\x1b[31m',
  fgGreen: '\x1b[32m',
  fgYellow: '\x1b[33m',
  fgBlue: '\x1b[34m',
  fgPink: '\x1b[35m',
  fgCyan: '\x1b[36m',
  fgWhite: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
}

/**
 * @class A console.log() wrapper that logs more information.
 */
class Logger {

  /**
   * Options of Logger's constructor.
   * @typedef LoggerOptions
   * @property {boolean} useColor Whether to use colored output.
   * @property {string} logLevel One of verbose, debug, info, warn, error.
   */

  /**
   * Create a Logger instance.
   * @param {string} appName The application name to use in logs.
   * @param {LoggerOptions} options 
   */
  constructor(appName, options = {}) {
    this.appName = appName
    this.useColor = (typeof options.useColor === 'undefined')
      ? true : options.useColor
    this.setLogLevel(options.logLevel)
  }

  /**
   * Log verbose messages.
   * @returns RET_SUCCESS if messages are logged to console. 
   * RET_FAIL if not.
   */
  verbose() {
    if (LOG_LEVEL.verbose >= this.logLevel) {
      let args = Array.from(arguments)
      args.unshift(this._makeHeader('V', STYLE.bold + STYLE.fgBlue))
      console.error.apply(console, args)
      return RET_SUCCESS
    } else {
      return RET_FAIL
    }
  }

  /**
   * Log debug messages.
   * @returns RET_SUCCESS if messages are logged to console. 
   * RET_FAIL if not.
   */
  debug() {
    if (LOG_LEVEL.debug >= this.logLevel) {
      let args = Array.from(arguments)
      args.unshift(this._makeHeader('D', STYLE.bold + STYLE.fgBlue))
      console.log.apply(console, args)
      return RET_SUCCESS
    } else {
      return RET_FAIL
    }
  }

  /**
   * Log info messages.
   * @returns RET_SUCCESS if messages are logged to console. 
   * RET_FAIL if not.
   */
  info() {
    if (LOG_LEVEL.info >= this.logLevel) {
      let args = Array.from(arguments)
      args.unshift(this._makeHeader('I', STYLE.bold + STYLE.fgGreen))
      console.log.apply(console, args)
      return RET_SUCCESS
    } else {
      return RET_FAIL
    }
  }

  /**
   * Log warn messages.
   * @returns RET_SUCCESS if messages are logged to console. 
   * RET_FAIL if not.
   */
  warn() {
    if (LOG_LEVEL.warn >= this.logLevel) {
      let args = Array.from(arguments)
      args.unshift(this._makeHeader('W', STYLE.bold + STYLE.fgYellow))
      console.log.apply(console, args)
      return RET_SUCCESS
    } else {
      return RET_FAIL
    }
  }

  /**
   * Log error messages.
   * @returns RET_SUCCESS if messages are logged to console. 
   * RET_FAIL if not.
   */
  error() {
    if (LOG_LEVEL.error >= this.logLevel) {
      let args = Array.from(arguments)
      args.unshift(this._makeHeader('E', STYLE.bold + STYLE.fgRed))
      console.error.apply(console, args)
      return RET_SUCCESS
    } else {
      return RET_FAIL
    }
  }

  /**
   * Set or change the log level of the logger instance.
   * @param {string} str One of verbose, debug, info, warn, error.
   * @returns {number} RET_SUCCESS when set successfully, RET_FAIL when 
   * set unsuccessfully and fallback to default: "warn".
   */
  setLogLevel(str) {
    switch (str) {
      case 'verbose':
        this.logLevel = LOG_LEVEL.verbose
        break;
      case 'debug':
        this.logLevel = LOG_LEVEL.debug
        break
      case 'info':
        this.logLevel = LOG_LEVEL.info
        break
      case 'warn':
        this.logLevel = LOG_LEVEL.warn
        break
      case 'error':
        this.logLevel = LOG_LEVEL.error
        break
      default:
        this.warn(`Unknown log level string: ${str}, please specify one of\
 verbose, debug, info, warn, error.`)
        this.logLevel = LOG_LEVEL_DEFAULT
        return RET_FAIL
    }

    return RET_SUCCESS
  }

  /**
   * Compose the log header displayed before messages.
   * @private
   * @param {string} logLevelLabel The string label representing the log
   * level.
   * @param {string} style One of constant defined in STYLE object.
   * @returns {string} The composed header.
   */
  _makeHeader(logLevelLabel, style) {
    const h = `${logLevelLabel}/${this.appName}(${getTime()}):`
    if (this.useColor && style)
      return style + h + STYLE.reset
    else
      return h 
  }
}

/*************************************************************************
 * Utility Functions                                                     *
 *************************************************************************/

/**
 * Get local time in format like "2019-03-14+02:48:37.662".
 * @function getTime
 * @returns {string} Local time in format like "2019-03-14+02:48:37.662".
 */
function getTime() {
  let date = new Date()
  let offset = date.getTimezoneOffset() * 60000
  let timeStamp = Date.now() - offset
  return new Date(timeStamp).toISOString()
    .replace(/Z|-|:/g, '')
}

/**
 * Filter circular object for JSON.stringify()
 * @function getCircularReplacer
 * @returns {object} Filtered object.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cyclic_object_value
 */
function getCircularReplacer() {
  const seen = new WeakSet()
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return
      }
      seen.add(value)
    }
    return value
  }
}

/*************************************************************************
 * Exports                                                               *
 *************************************************************************/

module.exports = { Logger, RET_FAIL, RET_SUCCESS }
