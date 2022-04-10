/*
 * @Author: Zhouqi
 * @Date: 2022-03-21 20:00:07
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-10 14:55:01
 */
export * from "./shapeFlags";
export * from "./normalizeProp";
export * from "./toDisplayString";

// 重新定义方法名，使其更具语义化命名
export const extend = Object.assign;
export const isArray = Array.isArray;

// 判断值是不是对象
export const isObject = (val) => val !== null && typeof val === "object";

// 判断值是不是字符串
export const isString = (val) => typeof val === "string";

// 判断值是不是函数
export const isFunction = (val) => typeof val === "function";

// 新旧值是否有变化，以及对NaN的判断处理 NaN === NaN为false
export const hasChanged = (value: any, oldValue: any): boolean =>
  !Object.is(value, oldValue);

// 判断是否是事件属性：onClick …………
export const isOn = (key: string) => /^on[^a-z]/.test(key);

// 烤肉串命名转驼峰 add-name ===> addName
export const camelize = (str: string): string =>
  str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ""));

// 将addName这种转化为AddName
export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

// 处理事件触发的事件名
export const toHandlerKey = (str: string) =>
  str ? `on${capitalize(str)}` : "";

export const EMPTY_OBJ = {};

// 循环数组中的所有方法
export const invokeArrayFns = (fns: Function[]) => {
  const length = fns.length;
  for (let i = 0; i < length; i++) {
    fns[i]();
  }
};

// 判断某个对象中是否有指定属性
export const hasOwn = (target, key) => {
  return Object.prototype.hasOwnProperty.call(target, key);
};
