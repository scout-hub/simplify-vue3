/*
 * @Author: Zhouqi
 * @Date: 2022-04-05 21:16:28
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-26 09:43:24
 */

import { isArray } from "@simplify-vue/shared";

// 微任务队列
const queue: Function[] = [];
// 创建微任务
const resolvedPromise = Promise.resolve();
// 当前正在执行的微任务
let currentFlushPromise;
// 是否正在调度任务
let isFlushing = false;

// 正在等待的PostFlush队列
const pendingPostFlushCbs: Function[] = [];
// 正在执行的PostFlush队列
let activePostFlushCbs: Function[] | null = null;

/**
 * @author: Zhouqi
 * @description: 将回调推迟到下一个 DOM 更新周期之后执行。在更改了一些数据以等待 DOM 更新后立即使用它
 * @param fn 回调任务
 */
export function nextTick(fn) {
  const p = currentFlushPromise || resolvedPromise;
  return fn ? p.then(fn) : p;
}

/**
 * @author: Zhouqi
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
 * @author: Zhouqi
 * @description:
 * @param  cb postFlush类型的回调任务
 * @param  activeQueue 正在执行的postFlush队列
 * @param  pendingQueue 等待执行的postFlush队列
 */
function queueCb(cb, activeQueue: Function[] | null, pendingQueue: Function[]) {
  // cb是array说明是组件的生命周期回调函数
  if (isArray(cb)) {
    pendingQueue.push(...cb);
  } else {
    // 单独的任务 比如watch的scheduler调度器
    pendingQueue.push(cb);
  }
  queueFlush();
}

/**
 * @author: Zhouqi
 * @description: 往pendingPostFlushCbs中添加postFlush类型的任务
 * @param cb 回调任务
 */
export function queuePostFlushCb(cb) {
  queueCb(cb, activePostFlushCbs, pendingPostFlushCbs);
}

/**
 * @author: Zhouqi
 * @description: 执行postFlush任务
 */
export function flushPostFlushCbs() {
  if (!pendingPostFlushCbs.length) return;
  const deduped = [...new Set(pendingPostFlushCbs)];
  // 清空队列，避免flushPostFlushCbs多次调用执行多次相同任务
  pendingPostFlushCbs.length = 0;

  if (activePostFlushCbs) {
    activePostFlushCbs.push(...deduped);
    return;
  }
  activePostFlushCbs = deduped;
  for (let i = 0; i < activePostFlushCbs.length; i++) {
    const postFlushJob = activePostFlushCbs[i];
    postFlushJob();
  }
  activePostFlushCbs = null;
}

/**
 * @author: Zhouqi
 * @description: 执行微任务
 */
function queueFlush() {
  // 避免多次调用
  if (!isFlushing) {
    currentFlushPromise = resolvedPromise.then(flushJobs);
  }
}

/**
 * @author: Zhouqi
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
    console.log(error);
  } finally {
    isFlushing = false;
    // 任务执行完成，重置微任务队列
    queue.length = 0;
    // 执行需要在更新之后触发的任务
    flushPostFlushCbs();
  }
}
