/*
 * @Author: Zhouqi
 * @Date: 2022-05-02 19:35:47
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-02 19:36:48
 */
import { isArray, isString, isObject } from "@simplify-vue/shared";

export function renderList(source, renderItem, cache?, index?) {
  let ret;
  const cached = cache && cache[index!];

  if (isArray(source) || isString(source)) {
    ret = new Array(source.length);
    for (let i = 0, l = source.length; i < l; i++) {
      ret[i] = renderItem(source[i], i, undefined, cached && cached[i]);
    }
  } else if (typeof source === "number") {
    ret = new Array(source);
    for (let i = 0; i < source; i++) {
      ret[i] = renderItem(i + 1, i, undefined, cached && cached[i]);
    }
  } else if (isObject(source)) {
    if (source[Symbol.iterator as any]) {
      ret = Array.from(source as Iterable<any>, (item, i) =>
        renderItem(item, i, undefined, cached && cached[i])
      );
    } else {
      const keys = Object.keys(source);
      ret = new Array(keys.length);
      for (let i = 0, l = keys.length; i < l; i++) {
        const key = keys[i];
        ret[i] = renderItem(source[key], key, i, cached && cached[i]);
      }
    }
  } else {
    ret = [];
  }

  if (cache) {
    cache[index!] = ret;
  }
  return ret;
}
