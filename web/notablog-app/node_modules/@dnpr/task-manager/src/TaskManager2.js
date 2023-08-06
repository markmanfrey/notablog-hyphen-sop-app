/**
 * @typedef TaskManager2Options
 * @property {number} [concurrency]
 */

class TaskManager2 {

  /**
   * @param {TaskManager2Options} opts 
   */
  constructor(opts = {}) {
    this.active = 0
    this.maxActive = opts.concurrency || 3
    this.reqQueue = []
  }

  /**
   * Queue an async function call.
   * @param {() => Promise<any>} func - A function that returns a Promise.
   * @param {any[]} args - Arguments for the function.
   * @returns {Promise<any>} A Promise that wraps the Promise returned by
   * the async function, i.e. its interface is the same as the original 
   * Promise, so it can be used in the same way as usual.
   */
  queue(func, args) {
    return new Promise((resolve, reject) => {
      this.reqQueue.push({
        task: { func, args },
        success_callback: resolve,
        failure_callback: reject
      })
      this._run()
    })
  }

  /**
   * Check if there are empty concurrency threads and pending tasks. 
   * Execute a task if there is an idle concurrency thread.
   * @private
   */
  _run() {
    if (this.active < this.maxActive) {
      if (this.reqQueue.length > 0) {
        this.active++
        const req = this.reqQueue.shift()
        req.task.func.apply(null, req.task.args)
          .then((data) => {
            req.success_callback(data)
            this._next()
          })
          .catch((error) => {
            req.failure_callback(error)
            this._next()
          })
      }
    }
  }

  /**
   * Idle a concurrency thread and check if there are tasks to execute.
   * @private
   */
  _next() {
    this.active--
    this._run()
  }

}

module.exports = TaskManager2