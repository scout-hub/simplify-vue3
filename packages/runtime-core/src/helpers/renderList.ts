/*
 * @Author: Zhouqi
 * @Date: 2022-05-02 19:35:47
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-03 14:34:43
 */
import { isArray } from "@simplify-vue/shared";

export function renderList(source, renderItem) {
  let result;
  if (isArray(source)) {
    result = [];
    for (let i = 0, l = source.length; i < l; i++) {
      result[i] = renderItem(source[i], i);
    }
  }
  return result;
}
