/*
 * @Author: Zhouqi
 * @Date: 2022-04-24 21:35:42
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-10 21:24:58
 */
import { currentRenderInstance } from "./componentRenderContext";

export function withDirectives(vnode, directives) {
  const internalInstance: any = currentRenderInstance!;
  const instance = internalInstance.proxy;
  const bindings = vnode.dirs || (vnode.dirs = []);
  for (let i = 0; i < directives.length; i++) {
    let [dir, value] = directives[i];
    bindings.push({
      dir,
      instance,
      value,
      oldValue: void 0,
    });
  }
  return vnode;
}

/**
 * @author: Zhouqi
 * @description: 触发指令钩子函数
 * @param vnode
 * @param oldVnode
 * @param name 钩子函数名
 */
export function invokeDirectiveHook(vnode, oldVnode, name) {
  const bindings = vnode.dirs;
  const oldBindings = oldVnode && oldVnode.dirs;
  for (let i = 0; i < bindings.length; i++) {
    const binding = bindings[i];
    if (oldBindings) {
      binding.oldValue = oldBindings[i].value;
    }
    const hook = binding.dir[name];
    hook && hook(vnode.el, binding, vnode);
  }
}
