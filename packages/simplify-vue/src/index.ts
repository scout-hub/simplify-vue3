/*
 * @Author: Zhouqi
 * @Date: 2022-03-27 14:28:06
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-26 11:40:40
 */
import { compile } from "@simplify-vue/compiler-dom";
import { registerRuntimeCompiler } from "@simplify-vue/runtime-dom";
import * as runtimeDom from "@simplify-vue/runtime-dom";

export * from "@simplify-vue/runtime-dom";

function compileToFunction(template, options?) {
  const { code } = compile(template, options);
  const render = new Function("Vue", code)(runtimeDom);
  return render;
}

registerRuntimeCompiler(compileToFunction);
