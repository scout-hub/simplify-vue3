/*
 * @Author: Zhouqi
 * @Date: 2022-04-23 10:10:59
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-24 20:58:00
 */

import { createObjectProperty } from "./transformElement";

/**
 * @author: Zhouqi
 * @description: 转换v-bind指令
 * @param dir v-bind属性ast
 * @return props
 */
export function transformBind(dir) {
  const { arg, exp } = dir;
  // arg和exp在parse的时候已经处理成simpleExpression了，无需像静态属性一样createSimpleExpression
  const props = createObjectProperty(arg, exp);
  return { props: [props] };
}
