/*
 * @Author: Zhouqi
 * @Date: 2022-03-20 20:47:45
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-03-30 17:16:50
 */
import {
  reactiveHandler,
  readonlyHandler,
  shallowReadonlyHandler,
  shallowReactiveHandler,
} from "./baseHandlers";

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
  IS_SHALLOW = "__v_isShallow",
  RAW = "__v_raw",
}

export interface Target {
  [ReactiveFlags.IS_REACTIVE]?: boolean;
  [ReactiveFlags.IS_READONLY]?: boolean;
  [ReactiveFlags.IS_SHALLOW]?: boolean;
  [ReactiveFlags.RAW]?: any;
}

// 创建响应式对象
export function reactive(raw: object) {
  // 如果对象是一个只读的proxy，则直接返回
  if (isReadonly(raw)) {
    return raw;
  }
  return createReactive(raw, reactiveHandler);
}

// 创建浅响应对象
export function shallowReactive(raw: object) {
  return createReactive(raw, shallowReactiveHandler);
}

// 创建只读对象
export function readonly(raw: object) {
  return createReactive(raw, readonlyHandler);
}

// 创建浅只读对象
export function shallowReadonly(raw: object) {
  return createReactive(raw, shallowReadonlyHandler);
}

// 对象是不是响应式的
export function isReactive(variable: unknown): boolean {
  return !!(variable as Target)[ReactiveFlags.IS_REACTIVE];
}

// 对象是不是只读的
export function isReadonly(variable: unknown): boolean {
  return !!(variable as Target)[ReactiveFlags.IS_READONLY];
}

// 对象是不是readonly或者reactive的
export function isProxy(variable: unknown): boolean {
  return isReactive(variable) || isReadonly(variable);
}

// 返回代理对象的原始对象
export function toRaw<T>(observed: T): T {
  const raw = observed && observed[ReactiveFlags.RAW];
  // toRaw返回的对象依旧是代理对象，则递归去找原始对象
  return raw ? toRaw(raw) : observed;
}

function createReactive(raw: Target, handler: ProxyHandler<object>) {
  return new Proxy(raw, handler);
}
