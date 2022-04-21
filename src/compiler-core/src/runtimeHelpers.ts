/*
 * @Author: Zhouqi
 * @Date: 2022-04-09 22:40:56
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-21 22:13:04
 */
export const TO_DISPLAY_STRING = Symbol("toDisplayString");
export const OPEN_BLOCK = Symbol("openBlock");
export const CREATE_ELEMENT_BLOCK = Symbol("createElementBlock");
export const CREATE_ELEMENT_VNODE = Symbol("createElementVNode");
export const CREATE_TEXT = Symbol("createTextVNode");

export const helperNameMap: any = {
  [TO_DISPLAY_STRING]: "toDisplayString",
  [OPEN_BLOCK]: "openBlock",
  [CREATE_ELEMENT_BLOCK]: "createElementBlock",
  [CREATE_ELEMENT_VNODE]: "createElementVNode",
  [CREATE_TEXT]: "createTextVNode",
};
