/*
 * @Author: Zhouqi
 * @Date: 2022-04-03 14:53:41
 * @LastEditors: Zhouqi
 * @LastEditTime: 2023-03-10 14:44:44
 */

import { createVnode } from "./vnode";

export function createAppApi(render) {
  return function createApp(rootComponent) {
    const app = {
      _container: null,
      use() { },
      mixin() { },
      component() { },
      directive() { },
      mount(rootContainer) {
        // 创建虚拟节点
        const vnode = createVnode(rootComponent);
        // 渲染真实节点
        render(vnode, rootContainer);
        app._container = rootContainer;
      },
      unmount() {
        render(null, app._container);
      },
      provide() { },
    };
    return app;
  };
}
