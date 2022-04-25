/*
 * @Author: Zhouqi
 * @Date: 2022-03-27 14:28:06
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-25 09:22:15
 */
import { compile } from "./compiler-dom/src";
import { registerRuntimeCompiler } from "./runtime-core/src";
import * as runtimeDom from "./runtime-dom/src";

export * from "./runtime-dom/src";
export * from "./reactivity/src";

function compileToFunction(template, options?) {
  const { code } = compile(template, options);
  const render = new Function("Vue", code)(runtimeDom);
  return render;
}

registerRuntimeCompiler(compileToFunction);
