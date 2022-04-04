/*
 * @Author: Zhouqi
 * @Date: 2022-03-22 17:58:01
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-03-30 16:32:11
 */
import { track, trigger } from "./effect";
import { reactive, ReactiveFlags, readonly, Target } from "./reactive";
import { isObject, extend, hasChanged } from "../../shared/src/index";

// 封装proxy get函数
const createGetter = function (isReadOnly = false, isShallow = false) {
  return function (target: Target, key: string, receiver: object) {
    // 如果访问的是__v_reactive，则返回!isReadOnly的值
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadOnly;
    }

    // 如果访问的是__v_isReadonly，则返回isReadOnly值
    if (key === ReactiveFlags.IS_READONLY) {
      return isReadOnly;
    }

    // 如果访问的是__v_raw属性，就返回原始对象
    if (key === ReactiveFlags.RAW) {
      return target;
    }

    const result = Reflect.get(target, key, receiver);

    // 只读属性不不能设置值，所以无需建立依赖关系
    if (!isReadOnly) {
      track(target, key);
    }

    // 浅响应
    if (isShallow) {
      return result;
    }

    // 深响应，如果访问的属性是一个对象则继续处理对象
    if (isObject(result)) {
      return isReadOnly ? readonly(result) : reactive(result);
    }

    return result;
  };
};

// 封装proxy set函数
const createSetter = function () {
  return function (
    target: Target,
    key: string,
    newValue: unknown,
    receiver: object
  ) {
    // 先获取旧的值，再去更新值，避免影响触发依赖的判断 oldValue !== newValue
    const oldValue = target[key];
    const result = Reflect.set(target, key, newValue, receiver);
    // 特殊情况：NaN !== NaN 为true
    if (hasChanged(newValue, oldValue)) {
      // 触发依赖
      trigger(target, key);
    }
    return result;
  };
};

// 初始化的时候创建
const reactiveGetter = createGetter();
const shallowReactiveGetter = createGetter(false, true);
const readonlyGetter = createGetter(true);
const shallowReadonlyGetter = createGetter(true, true);
const reactiveSetter = createSetter();

// 响应处理器
export const reactiveHandler: ProxyHandler<object> = {
  get: reactiveGetter,
  set: reactiveSetter,
};

// 浅响应处理器
export const shallowReactiveHandler: ProxyHandler<object> = {
  get: shallowReactiveGetter,
  set: reactiveSetter,
};

// 只读处理器
export const readonlyHandler: ProxyHandler<object> = {
  get: readonlyGetter,
  set(target: Target, key: string, newValue: unknown, receiver: object) {
    console.warn(`${key} is readonly`);
    return true;
  },
};

// 浅只读处理器
export const shallowReadonlyHandler: ProxyHandler<object> = extend(
  {},
  readonlyHandler,
  {
    get: shallowReadonlyGetter,
  }
);
