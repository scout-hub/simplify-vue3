/*
 * @Author: Zhouqi
 * @Date: 2022-04-26 13:40:50
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-29 16:49:54
 */
import { isString } from ".";
export function toDisplayString(text) {
  // null 和 undefined处理为''
  return isString(text) ? text : text == null ? "" : String(text);
}
