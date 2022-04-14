/*
 * @Author: Zhouqi
 * @Date: 2022-04-14 22:19:23
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-14 22:44:35
 */
import { ref } from "../../reactivity/src";
import { defineComponent } from "./apiDefineComponent";
import { createTextVnode } from "./vnode";

// 创建异步组件
export function defineAsyncComponent(source) {
  const {
    loader,
    loadingComponent,
    errorComponent,
    delay,
    timeout,
    suspensible,
    onError,
  } = source;

  // 解析到的组件
  let resolvedComp;

  const load = () => {
    return loader().then((c) => {
      resolvedComp = c.default;
      return c.default;
    });
  };

  return defineComponent({
    name: "AsyncComponentWrapper",
    setup() {
      const isLoadComp = ref(false);
      load().then(() => {
        isLoadComp.value = true;
      });
      return {
        isLoadComp,
      };
    },
    render() {
      return this.isLoadComp ? { type: resolvedComp } : createTextVnode("");
    },
  });
}
