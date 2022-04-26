/*
 * @Author: Zhouqi
 * @Date: 2022-04-24 20:32:13
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-26 11:46:47
 */
import { baseCompile } from "@simplify-vue/compiler-core";
import { extend } from "@simplify-vue/shared";
import { transformShow } from "./transform/vShow";

export * from "./runtimeHelpers";

export function compile(template, options = {}) {
  return baseCompile(
    template,
    extend({}, options, {
      directiveTransforms: {
        show: transformShow,
      },
    })
  );
}
