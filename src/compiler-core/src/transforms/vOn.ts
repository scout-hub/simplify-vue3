/*
 * @Author: Zhouqi
 * @Date: 2022-04-23 19:47:29
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-24 20:57:53
 */
import { toHandlerKey } from "../../../shared/src";
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
