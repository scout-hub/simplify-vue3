/*
 * @Author: Zhouqi
 * @Date: 2022-04-10 11:33:43
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-10 11:34:03
 */
import { NodeTypes } from "./ast";

export function isText(node) {
  return node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TEXT;
}
