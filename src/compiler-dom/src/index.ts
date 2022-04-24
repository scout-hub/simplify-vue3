/*
 * @Author: Zhouqi
 * @Date: 2022-04-24 20:32:13
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-24 21:33:16
 */
import { baseCompile } from "src/compiler-core/src";
import { extend } from "../../shared/src";
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
