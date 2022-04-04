/*
 * @Author: Zhouqi
 * @Date: 2022-04-03 16:57:13
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-03 17:08:47
 */
import { isArray, isObject, isString } from "./index";

/**
 * @description: 规范化class的值
 * @param value class的值
 */
export function normalizeClass(value) {
  // 处理的情况无非就是三种：字符串，数组，对象
  let result = "";
  if (isString(value)) {
    // 是字符串则直接拼接
    result += value;
  } else if (isArray(value)) {
    // 是数组情况就递归调用normalizeClass
    for (let i = 0; i < value.length; i++) {
      result += `${normalizeClass(value[i])} `;
    }
  } else if (isObject(value)) {
    for (const key in value) {
      // 值为true的class才需要拼接
      if (value[key]) {
        result += `${key} `;
      }
    }
  }
  return result.trim();
}
