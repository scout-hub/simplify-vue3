/*
 * @Author: Zhouqi
 * @Date: 2022-04-14 22:25:46
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-14 22:36:31
 */
import { isFunction } from "../../shared/src";

// 返回options，对ts支持度更好
export function defineComponent(options) {
  return isFunction(options) ? { setup: options } : options;
}
