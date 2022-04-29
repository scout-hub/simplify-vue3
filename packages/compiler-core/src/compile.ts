/*
 * @Author: Zhouqi
 * @Date: 2022-04-10 14:20:47
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-27 15:47:42
 */
import { extend } from "@simplify-vue/shared";
import { generate } from "./codegen";
import { baseParse } from "./parse";
import { transform } from "./transform";
import { transformElement } from "./transforms/transformElement";
import { transformExpression } from "./transforms/transformExpression";
import { transformText } from "./transforms/transformText";
import { transformBind } from "./transforms/vBind";
import { transformIf } from "./transforms/vIf";
import { transformOn } from "./transforms/vOn";

export function baseCompile(template, options) {
  const ast = baseParse(template);
  transform(
    ast,
    extend({}, options, {
      nodeTransforms: [
        transformIf,
        transformExpression,
        transformElement,
        transformText,
      ],
      directiveTransforms: extend({}, options.directiveTransforms, {
        bind: transformBind,
        on: transformOn,
      }),
    })
  );

  return generate(ast);
}