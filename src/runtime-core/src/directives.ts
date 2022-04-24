/*
 * @Author: Zhouqi
 * @Date: 2022-04-24 21:35:42
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-24 22:13:10
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
    });
  }
  return vnode;
}
