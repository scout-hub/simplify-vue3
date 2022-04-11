/*
 * @Author: Zhouqi
 * @Date: 2022-04-11 13:13:36
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-11 13:13:37
 */
// using literal strings instead of numbers so that it's easier to inspect
// debugger events

export const enum TrackOpTypes {
  GET = "get",
  HAS = "has",
  ITERATE = "iterate",
}

export const enum TriggerOpTypes {
  SET = "set",
  ADD = "add",
  DELETE = "delete",
  CLEAR = "clear",
}
