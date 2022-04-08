/*
 * @Author: Zhouqi
 * @Date: 2022-03-27 15:44:22
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-08 19:44:36
 */
import { isOn } from "../../shared/src/index";
import { patchAttr } from "./modules/attrs";
import { patchEvent } from "./modules/events";
import { patchDOMProp } from "./modules/props";

/**
 * @author: Zhouqi
 * @description: 处理props属性
 * 处理props时需要理解HTML Attribute 和 DOM property的关系
 *
 * 例如:
 * 我们可以通过input.value属性去获取input的文本值，这个value就是input元素上的属性，也就是DOM property
 * <input value="123" /> 这个value属性可以设置在input标签上，值可以通过getAttribute去获取，这个value就是HTML Attribute
 * HTML Attribute可能跟DOM property有对应的映射关系（id->id），也可能没有（aria-）或者有多个映射关系（value->value/defaultValue），同样名称也不一定对应（class->className）
 *
 * <input value="123" /> 上的value属性对应着元素input上的value属性，但是input标签上的value值并不总是和input元素上的值相等
 * 当我们初始化<input value="123" />时，通过input.value获取到的和input标签上的value值是一样的
 * 但是当我们修改input里面的内容时，通过input.value去访问value值和通过getAttribute方法获取inpu标签上的value值是不一样的
 * input标签上的value值依然还是初始时设置的值，因为我们可以认为HTML Attribute的值是DOM property上的初始值。
 *
 * 在处理元素属性上需要遵循一个结论：如果对应的属性可以在DOM property上找到，就去设置对应的DOM property，如果没找到就通过setAttribute去设置，当然还有其它特殊情况会慢慢补充
 * @param el 元素
 * @param key 属性名
 */
export function patchProp(el, key, preValue, nextValue) {
  if (shouldSetAsProp(el, key, nextValue)) {
    patchDOMProp(el, key, nextValue);
  } else if (key === "class") {
    // class通过className去设置性能最好
    el.className = nextValue;
  } else if (isOn(key)) {
    // 注册事件
    patchEvent(el, key, preValue, nextValue);
  } else {
    // 更新html属性
    patchAttr(el, key, nextValue);
  }
}

// 是否可以直接设置DOM property
function shouldSetAsProp(el, key, value) {
  // form属性是只读的，只能通过setAttribute设置属性
  if (key === "form") {
    return false;
  }
  return key in el;
}
