/*
 * @Author: Zhouqi
 * @Date: 2022-05-01 20:15:31
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-01 20:17:35
 */
import { createStructuralDirectiveTransform } from "../transform";

export function processFor(node, dir, context, fn) {}

export const transformFor = createStructuralDirectiveTransform(
  "for",
  (node, dir, context) => {
    return processFor(node, dir, context, () => {});
  }
);
