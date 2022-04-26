/*
 * @Author: Zhouqi
 * @Date: 2022-04-14 22:25:46
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-26 09:42:01
 */
import { isFunction } from "@simplify-vue/shared";

// 返回options，对ts支持度更好
export function defineComponent(options) {
  return isFunction(options) ? { setup: options } : options;
}
