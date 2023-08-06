const { log, randomInt } = require('./util')

/**
 * @module TaskManager
 */
module.exports = TaskManager

/**
 * @typedef TaskManagerOptions
 * @property {Number} delay - Ideal delay between two tasks.
 * @property {Number} delayJitterMax - Absolute value of max delay 
 * deviation added to ideal delay.
 * @property {Number} parallelNum - Number of tasks to be run in parallel.
 * @property {Boolean} debug - Whether to print debug messages.
 */

/**
 * Execution scheduler for sync or async functions.
 * @param {Array.<Object>} tasks - An array. Each element corresponds to 
 * one execFunc call where the element is the argument.
 * @param {Function} execFunc - The function that handles a task.
 * @param {TaskManagerOptions} options - An object to customize delay, 
 * delayJitterMax, parallelNum, debug.
 */
function TaskManager(tasks, execFunc, options = {}) {

  let execDelay = typeof options.delay === 'number'
    ? options.delay : 1000
  let execDelayJitterMax = typeof options.delayJitterMax === 'number'
    ? options.delayJitterMax : 100
  let parallelNum = options.parallelNum || 3
  let debugEnabled = options.debug || false
  let lastUnfinishedPtr = 0
  let lastUnscheduledPtr = 0
  let taskNum = tasks.length
  let async = execFunc() instanceof Promise
  let doneSignalEnabled = false
  let done

  if (parallelNum > taskNum) {
    if (debugEnabled) log('Warning: parallelNum should be smaller than taskNum.')
  }

  /**
   * Init <parallelNum> virtual threads and execute tasks.
   */
  this.start = () => {
    for (let i = 0; i < parallelNum; ++i) {
      doNext(lastUnscheduledPtr)
      if (debugEnabled) log(`Task ${lastUnscheduledPtr} scheduled.`)
      ++lastUnscheduledPtr
    }
  }

  /**
   * Return a Promise that will resolve when all tasks are finished.
   */
  this.finish = () => {
    doneSignalEnabled = true
    return new Promise((resolve) => {
      done = resolve
    })
  }

  /**
   * Execute next task.
   * @param {number} taskId - Index of a task in tasks array.
   */
  function doNext(taskId) {
    if (async) {
      execFunc(tasks[taskId])
        .then(() => {
          ++lastUnfinishedPtr
          if (debugEnabled) log(`Task ${taskId} finished.`)
          scheduleNext()
        })
    } else {
      execFunc(tasks[taskId])
      ++lastUnfinishedPtr
      if (debugEnabled) log(`Task ${taskId} finished.`)
      scheduleNext()
    }
  }

  /**
   * Schedule next task.
   */
  function scheduleNext() {

    /** Calculate a random delay. */
    let randomDelay = execDelay + randomInt(execDelayJitterMax)

    /** Check if there're unfinished tasks. */
    if (lastUnscheduledPtr < taskNum) {

      /** Cache the pointer so that doNext() after timeout can get the correct one. */
      let nextTaskId = lastUnscheduledPtr.valueOf()

      /** Some debug messages. */
      if (debugEnabled)
        log(`Task ${nextTaskId} scheduled. Delay ${randomDelay} ms before execution.`)

      /** Schedule the task with a timer. */
      if (execDelay > 0) {
        setTimeout(() => {
          doNext(nextTaskId)
        }, randomDelay)
      } else {
        doNext(nextTaskId)
      }

      /** Task is scheduled, move on to next task. */
      ++lastUnscheduledPtr

    } else if (lastUnfinishedPtr === taskNum) {

      /** 
       * When all tasks are finished,
       * if user had called this.finish() and gotten a Promise,
       * we resolve the Promise.
       */
      if (doneSignalEnabled) done()

    }

  }
}