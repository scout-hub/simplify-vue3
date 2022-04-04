/*
 * @Author: Zhouqi
 * @Date: 2022-03-27 14:37:57
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-03-27 14:38:59
 */
import { createVnode } from "./vnode";
export function h(type, props?, children?) {
  return createVnode(type, props, children);
}
