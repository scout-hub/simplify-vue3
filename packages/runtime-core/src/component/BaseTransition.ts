/*
 * @Author: Zhouqi
 * @Date: 2022-04-17 14:41:48
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-17 19:22:02
 */
export const BaseTransition = {
  name: "BaseTransition",

  props: {
    // enter
    onBeforeEnter: Function,
    onEnter: Function,
    onLeave: Function,
  },

  setup(props, { slots }) {
    return () => {
      const vnode = slots.default()[0];
      const enterHooks = resolveTransitionHooks(props);
      setTransitionHooks(vnode, enterHooks);
      return vnode;
    };
  },
};

/**
 * @author: Zhouqi
 * @description: 解析props
 * @param props
 * @return 钩子函数
 */
function resolveTransitionHooks(props) {
  const { onBeforeEnter, onEnter, onLeave } = props;

  const callhook = (hook, el) => {
    hook(el);
  };

  const hooks = {
    beforeEnter: (el) => {
      let hook = onBeforeEnter;
      callhook(hook, el);
    },
    enter(el) {
      let hook = onEnter;
      callhook(hook, el);
    },
    leave(el, remove) {
      if (onLeave) {
        // 动画结束后再执行DOM移除操作
        onLeave(el, remove);
      }
    },
  };
  return hooks;
}

/**
 * @author: Zhouqi
 * @description: 在vnode上设置transition hook，供组件在其不同生命周期内调用
 * @param vnode 虚拟节点
 * @param hooks 钩子函数
 */
function setTransitionHooks(vnode, hooks) {
  vnode.transition = hooks;
}
