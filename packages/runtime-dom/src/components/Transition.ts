/*
 * @Author: Zhouqi
 * @Date: 2022-04-17 15:01:49
 * @LastEditors: Zhouqi
 * @LastEditTime: 2023-03-11 09:13:07
 */
import { BaseTransition, h } from "@simplify-vue/runtime-core";
export const Transition = (props, { slots }) =>
  h(BaseTransition, resolveTransitionProps(props), slots);

Transition.props = {
  enterFromClass: String,
  enterActiveClass: String,
  enterToClass: String,
  leaveFromClass: String,
  leaveActiveClass: String,
  leaveToClass: String,
};

/**
 * @author: Zhouqi
 * @description: 解析transition上的属性
 * @param rawProps
 * @return 处理后的props
 */
function resolveTransitionProps(rawProps) {
  const {
    // type,
    enterFromClass,
    enterToClass,
    enterActiveClass,
    leaveFromClass,
    leaveActiveClass,
    leaveToClass,
  } = rawProps;

  // 进入动画结束后移除相关类
  const finishEnter = (el) => {
    removeTransitionClass(el, enterToClass);
    removeTransitionClass(el, enterActiveClass);
  };

  // 离开动画结束后移除相关类
  const finishLeave = (el, done) => {
    removeTransitionClass(el, leaveToClass);
    removeTransitionClass(el, leaveActiveClass);
    done && done(el);
  };

  function makeEnterHook() {
    return (el) => {
      const resolve = () => finishEnter(el);
      nextFrame(() => {
        removeTransitionClass(el, enterFromClass);
        addTransitionClass(el, enterToClass);
        whenTransitionEnds(el, resolve);
      });
    };
  }

  return {
    // dom创建到挂载dom阶段触发的函数
    onBeforeEnter(el) {
      addTransitionClass(el, enterFromClass);
      addTransitionClass(el, enterActiveClass);
    },
    // dom挂载后触发的函数
    onEnter: makeEnterHook(),
    onLeave(el, done) {
      const resolve = () => finishLeave(el, done);
      addTransitionClass(el, leaveFromClass);
      addTransitionClass(el, leaveActiveClass);
      nextFrame(() => {
        removeTransitionClass(el, leaveFromClass);
        addTransitionClass(el, leaveToClass);
        whenTransitionEnds(el, resolve);
      });
    },
  };
}

/**
 * @author: Zhouqi
 * @description: 添加动画类
 * @param el 添加类的元素
 * @param cls 类名
 */
function addTransitionClass(el, cls) {
  const regExp = /\s+/;
  // 通过空白符切分多个类名，循环添加到dom上
  cls.split(regExp).forEach((c) => c && el.classList.add(c));
}

/**
 * @author: Zhouqi
 * @description: 移除动画类
 * @param el 移除类的元素
 * @param cls 类名
 */
function removeTransitionClass(el, cls) {
  const regExp = /\s+/;
  // 通过空白符切分多个类名，循环移除dom上类
  cls.split(regExp).forEach((c) => c && el.classList.remove(c));
}

/**
 * @author: Zhouqi
 * @description: 在下一帧执行回调，因为浏览器只会在当前帧绘制DOM，
 * 结束状态的类名和起始状态的类名需要在两帧绘制，否则起始状态的类名不会被绘制出来
 * @param cb 下一帧触发的操作
 */
function nextFrame(cb) {
  requestAnimationFrame(() => {
    requestAnimationFrame(cb);
  });
}

/**
 * @author: Zhouqi
 * @description: 动画加载完成后移除类
 * @param el 要移除动画的元素
 * @param resolve 动画结束时的回调
 */
function whenTransitionEnds(el, resolve) {
  const onEnd = () => {
    el.removeEventListener("transitionend", onEnd);
    resolve();
  };
  el.addEventListener("transitionend", onEnd);
}
