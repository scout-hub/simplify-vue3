/*
 * @Author: Zhouqi
 * @Date: 2022-04-05 21:16:28
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-05 21:52:09
 */

// 微任务队列
const queue: Function[] = [];
// 创建微任务
const resolvedPromise = Promise.resolve();
// 当前正在执行的微任务
let currentFlushPromise;
// 是否正在调度任务
let isFlushing = false;

/**
 * @description: 将回调推迟到下一个 DOM 更新周期之后执行。在更改了一些数据以等待 DOM 更新后立即使用它
 * @param fn 回调任务
 */
export function nextTick(fn) {
  const p = currentFlushPromise || resolvedPromise;
  return fn ? p.then(fn) : p;
}

/**
 * @description: 调度任务队列
 * @param job 任务
 */
export function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }
  queueFlush();
}

/**
 * @description: 执行微任务
 */
function queueFlush() {
  if (!isFlushing) {
    // 避免多次调用
    currentFlushPromise = resolvedPromise.then(flushJobs);
  }
}

/**
 * @description: 执行微任务队列中的任务
 */
function flushJobs() {
  isFlushing = true;
  try {
    for (let i = 0; i < queue.length; i++) {
      const job = queue[i];
      job();
    }
  } catch (error) {
  } finally {
    isFlushing = false;
    // 任务执行完成，重置微任务队列
    queue.length = 0;
  }
}
