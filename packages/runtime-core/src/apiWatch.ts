/*
 * @Author: Zhouqi
 * @Date: 2022-04-10 19:35:50
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-09-16 16:43:26
 */
import { isReactive, isRef, ReactiveEffect } from "@simplify-vue/reactivity";
import {
  EMPTY_OBJ,
  extend,
  isArray,
  isFunction,
  isObject,
  isPlainObject,
} from "@simplify-vue/shared";
import { queuePostRenderEffect } from "./renderer";

/**
 * @author: Zhouqi
 * @description: watch函数
 * @param source 监听的内容
 * @param cb 监听内容变化时触发的回调函数
 * @param options 配置
 * @return unwatch 取消观测的函数
 */
export function watch(source, cb, options?) {
  return doWatch(source, cb, options);
}

/**
 * @author: Zhouqi
 * @description: 立即执行传入的一个函数，同时响应式追踪其依赖，并在其依赖变更时重新运行该函数。
 * @param effectFn
 * @param options
 * @return unwatch 取消观测的函数
 */
export function watchEffect(effectFn, options?) {
  // watchEffect 第二个参数为null
  return doWatch(effectFn, null, options);
}

/**
 * @author: Zhouqi
 * @description: watchEffect 的别名，带有 flush: 'post' 选项
 * @param effectFn
 * @param options
 * @return unwatch 取消观测的函数
 */
export function watchPostEffect(effectFn, options?) {
  return doWatch(effectFn, null, extend(options || {}, { flush: "post" }));
}

/**
 * @author: Zhouqi
 * @description: watchEffect 的别名，带有 flush: 'sync' 选项
 * @param effectFn
 * @param options
 * @return unwatch 取消观测的函数
 */
export function watchSyncEffect(effectFn, options?) {
  return doWatch(effectFn, null, extend(options || {}, { flush: "sync" }));
}

function doWatch(
  source,
  cb,
  { flush, deep, immediate }: Record<string, any> = EMPTY_OBJ
) {
  // 定义getter函数
  let getter;
  // 旧的值
  let oldValue;
  // 新的值
  let newValue;

  // 根据source的类型生成不同的getter
  if (isRef(source)) {
    getter = () => source.value;
  } else if (isReactive(source)) {
    getter = () => source;
    // 传入的如果是reactive的对象，默认把deep置为true进行深度监听
    deep = true;
  } else if (isArray(source)) {
    getter = () =>
      source.map((s) => {
        if (isRef(s)) {
          return s.value;
        } else if (isReactive(source)) {
          return traverse(s);
        } else if (isFunction(s)) {
          return s();
        }
      });
  } else if (isFunction(source)) {
    // 如果传入的是方法，直接赋值给getter
    getter = source;
  }

  /**
   * cleanup：副作用过期的回调
   * 假设watch的回调是请求接口，当第一次数据变化时请求一次接口，紧接着第二次数据变化时又请求了一次接口
   * 当第一个接口比第二个接口慢时，先获取到了第二个接口的数据，然后获取到第一个接口的数据，这是不正确的
   * 实际上执行第二次回调的时候，第一次的回调应该是过期状态，为了提示用户副作用过期了，需要提供一个cleanup
   * 函数，这个函数存储的是用户传入的副作用过期的回调，每次执行回调执行，假如有cleanup，则执行一次，告诉用户
   * 上一次的已经过期了
   */
  let cleanup;
  const onCleanup = (fn) => {
    cleanup = fn;
  };

  // 包装回调任务
  const job = () => {
    if (cb) {
      // newValue在值变化后触发的scheduler里面获取
      newValue = effect.run();
      // 辅助用户提示副作用过期
      if (cleanup) {
        cleanup();
      }
      cb(newValue, oldValue, onCleanup);
      // 重新赋值给旧的
      oldValue = newValue;
    } else {
      // 没有cb说明是watchEffect，直接执行副作用函数
      effect.run();
    }
  };

  if (cb && deep) {
    const baseGetter = getter;
    // 深度读取依赖的函数
    getter = () => traverse(baseGetter());
  }

  // watch的原理就是监听值的变化，通过自定义调度器来执行回调。当监听到的依赖的值变化时会触发effect上的schedular函数，从而触发回调函数
  let scheduler;
  if (flush === "sync") {
    // 立即执行，没有加入到回调缓冲队列中
    scheduler = job;
  } else if (flush === "post") {
    // 放进微任务队列中执行（组件更新后） 
    scheduler = () => queuePostRenderEffect(job); 
  } else {
    // pre
    scheduler = () => {
      // 组件更新前调用
      // TODO 加入回调缓冲队列中 组件更新前调用 queuePreFlushCb(job)
      job();
    };
  }

  const effect = new ReactiveEffect(getter, scheduler);

  if (cb) {
    if (immediate) {
      // 立即执行一次回调
      job();
    } else {
      // 默认执行一次，获取旧的值
      oldValue = effect.run();
    }
  }
  // 没有传入回调函数说明是watchEffect
  else if (flush === "post") {
    // 如果flush是post，则放入微任务队列中执行
    queuePostRenderEffect(effect.run.bind(effect));
  } else {
    effect.run();
  }

  return () => {
    // 移除依赖
    effect.stop();
  };
}

// 深度读取属性
function traverse(value, seen = new Set()) {
  // 如果值被读取过或者值是一个普通类型则直接返回值
  if (!isObject(value) || value === null || seen.has(value)) return value;

  // 通过Set来防止添加重复的值
  seen.add(value);
  if (isRef(value)) {
    traverse(value.value, seen);
  } else if (isPlainObject(value)) {
    // 是对象则遍历每一个属性，递归调用traverse
    for (const key in value) {
      traverse(value[key], seen);
    }
  }
  return value;
}
