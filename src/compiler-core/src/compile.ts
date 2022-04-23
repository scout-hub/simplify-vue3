/*
 * @Author: Zhouqi
 * @Date: 2022-04-10 14:20:47
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-23 10:43:49
 */
import { generate } from "./codegen";
import { baseParse } from "./parse";
import { transform } from "./transform";
import { transformElement } from "./transforms/transformElement";
import { transformExpression } from "./transforms/transformExpression";
import { transformText } from "./transforms/transformText";
import { transformBind } from "./transforms/vBind";

export function baseCompile(template) {
  const ast = baseParse(template);

  transform(ast, {
    nodeTransforms: [transformExpression, transformElement, transformText],
    directiveTransforms: {
      bind: transformBind,
    },
  });

  return generate(ast);
}
