/*
 * @Author: Zhouqi
 * @Date: 2022-04-06 10:04:06
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-08 19:38:42
 */
import {
  currentInstance,
  LifecycleHooks,
  setCurrentInstance,
  unsetCurrentInstance,
} from "./component";

/**
 * @author: Zhouqi
 * @description: 注入钩子函数
 * @param  lifecycleHook 生命周期钩子名称
 * @param  hook 要触发的生命周期函数
 */
function injectHooks(
  lifecycleHook: string,
  hook: Function,
  target: object | null = currentInstance
) {
  if (target) {
    const hooks = target[lifecycleHook] || (target[lifecycleHook] = []);
    // 包装一层
    const wrappedHook = () => {
      /**
       * 在执行生命周期函数时可能需要访问当前组件实例getCurrentInstance
       * 但是执行生命周期回调函数的时机是在setup之后，会访问不到当前组件实例
       * 因此我们需要在这里重新设置currentInstance
       */
      setCurrentInstance(target);
      hook();
      // 重置currentInstance
      unsetCurrentInstance();
    };
    hooks.push(wrappedHook);
  }
}

/**
 * @author: Zhouqi
 * @description: 注册生命周期钩子函数
 * @param LifecycleHook 生命周期钩子名称
 */
export const createHook = (lifecycleHook) => (hook) =>
  injectHooks(lifecycleHook, hook);

// 只能在setup中使用，因为内部需要使用当前组件实例
// 组件挂载之前触发
export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT);
// 组件挂载后触发
export const onMounted = createHook(LifecycleHooks.MOUNTED);
// 组件更新前触发
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE);
// 更新后触发
export const onUpdated = createHook(LifecycleHooks.UPDATED);
// 组件卸载之前触发
export const onBeforeUnmount = createHook(LifecycleHooks.BEFORE_UNMOUNT);
// 组件卸载完成后触发
export const onUnmounted = createHook(LifecycleHooks.UNMOUNTED);
