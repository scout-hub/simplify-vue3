/*
 * @Author: Zhouqi
 * @Date: 2022-04-06 10:04:06
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-06 12:41:32
 */
import {
  currentInstance,
  LifecycleHooks,
  setCurrentInstance,
  unsetCurrentInstance,
} from "./component";

/**
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
 * @description: 注册生命周期钩子函数
 * @param LifecycleHook 生命周期钩子名称
 */
export const createHook = (lifecycleHook) => (hook) =>
  injectHooks(lifecycleHook, hook);

// 只能在setup中使用，因为内部需要使用当前组件实例
// 组件挂载之前触发的函数
export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT);
// 组件挂载后触发的函数
export const onMounted = createHook(LifecycleHooks.MOUNTED);
