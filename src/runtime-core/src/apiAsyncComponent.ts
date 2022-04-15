/*
 * @Author: Zhouqi
 * @Date: 2022-04-14 22:19:23
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-15 23:04:57
 */
import { isFunction } from "src/shared/src";
import { ref } from "../../reactivity/src";
import { defineComponent } from "./apiDefineComponent";
import { currentInstance } from "./component";
import { createTextVnode, createVnode } from "./vnode";
import { onUnmounted } from "./apiLifecycle";

// 创建异步组件
export function defineAsyncComponent(source) {
  // 如果source是一个函数的话，说明传入的就是一个异步加载组件的函数
  if (isFunction(source)) {
    source = { loader: source };
  }

  const {
    // 异步加载组件的函数
    loader,
    loadingComponent,
    // 组件加载失败时显示的错误组件
    errorComponent,
    delay = 200,
    // 超时时间
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
      const loaded = ref(false);
      const errorLoaded = ref(false);
      // 注意：0是立即加载，不传默认是200
      const delayed = ref(!!delay);

      // defineAsyncComponent是一层包装组件，当写模板的时候可能会写一些插槽节点，这些节点需要传递给
      // 真正异步加载的组件使用，而不是给这个包装组件使用，因此我们需要获取当前包装组件的实例，将其身上的
      // slots传递给异步加载的组件
      const instance = currentInstance;

      if (delay) {
        const delayTimer = setTimeout(() => {
          /**
           * 指定时间后加载loading组件
           * 需要指定延迟时间是因为异步组件可能加载很快，如果不加延迟立马使用loading组件，可能会马上又把
           * loading组件销毁，这样就会有一个闪烁的过程。因此可以设定一个延迟时间尽可能避免这种情况出现。
           */
          if (!loaded.value) {
            delayed.value = false;
          }
        }, delay);
      }

      // 如果设置了超时时间，则开启一个定时器，定时回调任务触发时表示组件加载超时了
      if (timeout != null) {
        const timeoutTimer = setTimeout(() => {
          // 组件没有加载成功且没有加载失败的情况下，如果加载超时了，则赋值超时错误信息
          if (!loaded.value && !errorLoaded.value) {
            const error = new Error("组件加载超时了");
            errorLoaded.value = error;
          }
        }, timeout);
        // TODO 没触发，待研究
        onUnmounted(() => {
          clearTimeout(timeoutTimer);
        });
      }

      load()
        .then(() => {
          // 组件加载成功，修改标记
          loaded.value = true;
        })
        .catch((err) => (errorLoaded.value = err))
        .finally(() => {

        });
      return () => {
        // 根据组件加载成功标记来渲染
        if (loaded.value && resolvedComp) {
          return createInnerComp(resolvedComp, instance);
        } else if (errorLoaded.value && errorComponent) {
          // 将错误信息传递给error组件
          return createVnode(errorComponent, {
            error: errorLoaded.value,
          });
        } else if (!delay.value && loadingComponent) {
          // bug
          return createVnode(loadingComponent);
        }
        return createTextVnode("");
      };
    },
  });
}

/**
 * @author: Zhouqi
 * @description: 生成异步组件的vnode
 * @param  comp 组件配置
 * @return vnode
 */
function createInnerComp(comp, instance?) {
  // slots可以理解，不知为何要传props，包装组件没有通过props去接受，上次传递下来的都会放在包装组件的attrs上，
  // 这个attrs还是能够传递到异步加载的组件上，并且能和props进行合并（莫非是inheritAttr为false，而且想要props的数据？有待研究）
  const {
    vnode: { children, props },
  } = instance;
  return createVnode(comp, props, children);
}
