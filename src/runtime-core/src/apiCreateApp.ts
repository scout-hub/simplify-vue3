/*
 * @Author: Zhouqi
 * @Date: 2022-04-03 14:53:41
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-03 15:26:34
 */

import { createVnode } from "./vnode";

export function createAppApi(render) {
  return function createApp(rootComponent) {
    const app = {
      use() {},
      mixin() {},
      component() {},
      directive() {},
      mount(rootContainer) {
        // 创建虚拟节点
        const vnode = createVnode(rootComponent);
        // 渲染真实节点
        render(vnode, rootContainer);
      },
      unmount() {},
      provide() {},
    };
    return app;
  };
}
