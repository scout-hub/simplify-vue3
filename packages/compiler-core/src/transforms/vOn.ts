/*
 * @Author: Zhouqi
 * @Date: 2022-04-23 19:47:29
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-26 09:37:29
 */
import { toHandlerKey } from "@simplify-vue/shared";
import {
  createObjectProperty,
  createSimpleExpression,
} from "./transformElement";

export function transformOn(dir) {
  const { arg, exp } = dir;
  // @click ===> onClick
  let eventName = createSimpleExpression(toHandlerKey(arg.content), true);
  const ret = createObjectProperty(eventName, exp);
  return { props: [ret] };
}
