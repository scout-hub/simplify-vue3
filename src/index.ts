/*
 * @Author: Zhouqi
 * @Date: 2022-03-27 14:28:06
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-10 14:44:55
 */
import { baseCompile } from "./compiler-core/src";
import { registerRuntimeCompiler } from "./runtime-core/src";
import * as runtimeDom from "./runtime-dom/src";

export * from "./runtime-dom/src/index";
export * from "./reactivity/src/index";

function compileToFunction(template) {
  const { code } = baseCompile(template);
  const render = new Function("Vue", code)(runtimeDom);
  return render;
}

registerRuntimeCompiler(compileToFunction);
