/*
 * @Author: Zhouqi
 * @Date: 2022-03-27 14:28:06
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-23 11:32:42
 */
import { baseCompile } from "./compiler-core/src";
import { registerRuntimeCompiler } from "./runtime-core/src";
import * as runtimeDom from "./runtime-dom/src";

export * from "./runtime-dom/src";
export * from "./reactivity/src";

function compileToFunction(template) {
  const { code } = baseCompile(template);

  const render = new Function("Vue", code)(runtimeDom);

  return render;
}

registerRuntimeCompiler(compileToFunction);
