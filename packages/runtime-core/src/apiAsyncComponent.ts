/*
 * @Author: Zhouqi
 * @Date: 2022-04-14 22:19:23
 * @LastEditors: Zhouqi
 * @LastEditTime: 2023-12-22 14:44:21
 */
import { isFunction } from "@simplify-vue/shared";
import { ref } from "@simplify-vue/reactivity";
import { defineComponent } from "./apiDefineComponent";
import { currentInstance } from "./component";
import { createTextVNode, createVNode } from "./vnode";
import { onBeforeUnmount } from "./apiLifecycle";

// 创建异步组件
export function defineAsyncComponent(source) {
  // 如果source是一个函数的话，说明传入的就是一个异步加载组件的函数
  if (isFunction(source)) {
    source = { loader: source };
  }

  const {
    // 异步加载组件的函数
    loader,
    // 加载组件
    loadingComponent,
    // 组件加载失败时显示的错误组件
    errorComponent,
    // 展示加载组件前的延迟时间，默认为 200ms
    delay = 200,
    // 超时时间
    timeout,
    // suspensible,
    onError: userOnError,
  } = source;

  // 解析到的组件
  let resolvedComp;
  // 错误重试次数
  let retries = 0;

  // 重试函数，返回异步加载组件的函数
  const retry = () => {
    retries++;
    return load();
  };

  const load = () => {
    return loader()
      .then((c) => {
        resolvedComp = c.default;
        return c.default;
      })
      .catch((err) => {
        err = new Error("组件加载失败");
        // 如果用户定义了错误处理函数，则将控制权交给用户
        if (userOnError) {
          return new Promise((resolve, reject) => {
            const userRetry = () => resolve(retry());
            const userFail = () => reject(err);
            userOnError(err, userRetry, userFail, retries + 1);
          });
        } else {
          throw err;
        }
      });
  };

  return defineComponent({
    name: "AsyncComponentWrapper",
    setup() {
      const loaded = ref(false);
      const errorLoaded = ref(false);
      // 注意：0是立即加载，不传默认是200
      const delayed = ref(!!delay);

      let timeoutTimer;
      let delayTimer;

      // defineAsyncComponent是一层包装组件，当写模板的时候可能会写一些插槽节点，这些节点需要传递给
      // 真正异步加载的组件使用，而不是给这个包装组件使用，因此我们需要获取当前包装组件的实例，将其身上的
      // slots传递给异步加载的组件
      const instance = currentInstance;

      if (delay) {
        delayTimer = setTimeout(() => {
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
        timeoutTimer = setTimeout(() => {
          // 组件没有加载成功且没有加载失败的情况下，如果加载超时了，则赋值超时错误信息
          if (!loaded.value && !errorLoaded.value) {
            const error = new Error(
              `Async component timed out after ${timeout}ms.`
            );
            errorLoaded.value = error;
          }
        }, timeout);
      }

      // 组件销毁前清除定时器
      onBeforeUnmount(() => {
        clearTimeout(timeoutTimer);
        clearTimeout(delayTimer);
        delayTimer = null;
        timeoutTimer = null;
      });

      load()
        .then(() => {
          // 组件加载成功，修改标记
          loaded.value = true;
        })
        .catch((err) => {
          // 如果用户定义了错误处理函数并且调了用fail才会进到这里
          errorLoaded.value = err;
        });

      return () => {
        // 根据组件加载成功标记来渲染
        if (loaded.value && resolvedComp) {
          return createInnerComp(resolvedComp, instance);
        } else if (errorLoaded.value && errorComponent) {
          // 将错误信息传递给error组件，便于用户进行更精细的操作
          return createVNode(errorComponent, {
            error: errorLoaded.value,
          });
        } else if (!delayed.value && loadingComponent) {
          return createVNode(loadingComponent);
        }
        return createTextVNode("");
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
  // 这个attrs还是能够传递到异步加载的组件上，并且能和props进行合并
  const {
    vnode: { children, props },
  } = instance;
  return createVNode(comp, props, children);
}
