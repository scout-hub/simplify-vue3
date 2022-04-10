/*
 * @Author: Zhouqi
 * @Date: 2022-04-09 22:40:56
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-10 10:08:36
 */
export const TO_DISPLAY_STRING = Symbol("toDisplayString");
export const OPEN_BLOCK = Symbol("openBlock");
export const CREATE_ELEMENT_BLOCK = Symbol("createElementBlock");

export const helperNameMap: any = {
  [TO_DISPLAY_STRING]: "toDisplayString",
  [OPEN_BLOCK]: "openBlock",
  [CREATE_ELEMENT_BLOCK]: "createElementBlock",
};
