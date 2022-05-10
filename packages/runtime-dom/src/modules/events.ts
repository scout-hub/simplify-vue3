/*
 * @Author: Zhouqi
 * @Date: 2022-03-28 20:16:47
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-10 21:12:05
 */

import { isArray } from "@simplify-vue/shared";

// 事件绑定
export function addEventListener(el, event, handler) {
  el.addEventListener(event, handler);
}

// 事件销毁
export function removeEventListener(el, event, handler) {
  el.removeEventListener(event, handler);
}

// 获取当前时间，默认使用低精度时间
let _getNow = Date.now;

/**
 * 由于不同浏览器事件的timeStamp使用的epoch time（新纪元时间）不同，因此这里需要兼容当前时间的获取
 * 当游览器事件使用的timeStamp是低精度时间（新纪元时间为 0:0:0 UTC 1st January 1970.）时，getNow函数需要使用Date.now（低精度）
 * 当浏览器事件使用的timeStamp是高精度时间时（新纪元时间为系统启动的时间），getNow函数需要使用performace.now（高精度）
 *
 * https://www.w3.org/TR/2000/REC-DOM-Level-2-Events-20001113/events.html#Events-Event-timeStamp
 * https://www.w3.org/TR/hr-time/#sec-domhighrestimestamp
 * http://jimliu.net/2014/03/16/hrt-in-js/
 */
if (
  typeof window !== "undefined" &&
  window.performance &&
  window.performance.now
) {
  const eventTimeStamp = document.createEvent("event").timeStamp;
  // 假如当前时间大于事件的timeStamp，则认为事件使用的是高精度时间，此时getNow函数也应该返回高精度时间
  if (_getNow() > eventTimeStamp) {
    _getNow = () => window.performance.now();
  }
}

// 为了优化频繁调用performance.now的性能，我们在一个事件循环内注册的所有事件统一使用一个timeStamp
let cachedNow = 0;
// 创建微任务，当一个tick执行完时重置cachedNow
const p = Promise.resolve();
const rest = () => {
  cachedNow = 0;
};
const getNow = () => cachedNow || (p.then(rest), (cachedNow = _getNow()));

// props上的事件注册函数
export function patchEvent(el, key, preValue, nextValue) {
  /**
   * 这里创建一个伪造的事件代理函数invoker，将原始事件赋值到invoker的value属性上
   * 将invoker作为最终绑定的事件，在执行invoker函数时内部会执行原始的绑定事件，即执行invoker.value()
   *
   * 新建伪造的事件代理函数有几个作用：
   * 1、方便事件更新
   * 2、控制原始事件的执行（涉及到事件冒泡机制）
   * 3、…………?
   *
   * 由于原生事件类型有很多，为了不互相覆盖，这里需要建立一个map对象invokers，key指代事件类型，值是伪造的事件代理函数
   */
  const invokers = el._vei || (el._vei = {});
  const eventName = key.slice(2).toLowerCase();
  const hasInvoker = invokers[eventName];

  if (nextValue) {
    // 如果存在新的值且旧的事件代理函数存在，则表示更新事件，否则表示添加新的事件绑定
    if (hasInvoker) {
      /**
       * 1、方便事件更新
       * 在更新事件时，不需要销毁原来的事件，再绑定新的事件，而只要更新invoker.value属性即可
       */
      hasInvoker.value = nextValue;
    } else {
      const invoker = (invokers[eventName] = createInvoker(nextValue));
      addEventListener(el, eventName, invoker);
      invoker.attached = getNow();
    }
  } else if (hasInvoker) {
    // 新的值不存在且事件代理函数存在，则表示销毁事件绑定
    removeEventListener(el, eventName, hasInvoker);
    invokers[eventName] = undefined;
  }
}

// 创建事件代理函数
function createInvoker(events) {
  const invoker: any = (e) => {
    const timestamp = e.timeStamp;
    /**
     * 2、控制原始事件的执行（涉及到事件冒泡机制）
     * 假设父vnode上有onClick事件，事件值取决于一个响应式数据的值，比如：onClick: isTrue ? () => console.log(1) : null，
     * 子vnode上有一个绑定事件onClick: () => { isTrue = true }，当点击子vnode时会触发click事件，由于事件冒泡机制，click
     * 会向上冒泡到父节点，由于isTrue初始为false，因此父节点上不应该有绑定的click事件，但是却打印了1。
     * 这是由于vue的更新机制和事件冒泡时机导致的，实际上当isTrue被修改为true时触发了事件更新，更新后父节点上绑定了事件，之后事件才
     * 冒泡到父节点上，执行了父节点绑定的click事件。而解决方式就是在执行子元素事件的时候记录事件执行的时间，在这个时间点之后绑定的事件都
     * 不要去执行，这时候就需要有控制原始事件执行的功能。
     */
    // 事件冒泡时，e会往上传递其中s.timestamp就是事件最开始执行的事件
    if (timestamp < invoker.attached) return;
    // 如果events是一个数组，则循环执行
    isArray(invoker.value)
      ? invoker.value.forEach((fn) => fn(e))
      : invoker.value(e);
  };
  invoker.value = events;
  return invoker;
}
