# task-manager

A simple JavaScript task scheduler that manages execution of synchronous or asynchronous tasks.

## Installation

```bash
npm install @dnpr/task-manager
```

## Usage

* (Recommended) To use v2, see [`test/TaskManager2.spec.js`](test/TaskManager2.spec.js).
* To use v1, see [`test/TaskManager.spec.js`](test/TaskManager.spec.js).

## Background

Since this scheduler still executes tasks with single thread, it cannot make synchronous, computation intensive tasks faster. However, if the tasks are asynchronous, such as web requests or file-system reads / writes, which are more I/O bounded, they have chances to benefit from the **concurrency** under single thread.

The original reason I write this is for web crawling. I found making requests one by one was too slow, so I wonder if I can make it run in parallel. It turned out that I had to add quite much code to achieve the goal. Therefore, I decided to write a library to make reusing easier.

With this library I just need to prepare 3 things:

1. A tasks array, where each task is an object containing a URL and some metadata.
2. A function that execute a task. For instance, making a request to the URL and save its response.
3. A config object describing how to schedule the tasks. It may include the number of tasks that should run in parallel, the delay between two tasks, and the variation of delay to add some "randomness" to the traffic shape.

Then, let it run and wait !