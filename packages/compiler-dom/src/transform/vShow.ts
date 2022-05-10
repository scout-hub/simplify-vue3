/*
 * @Author: Zhouqi
 * @Date: 2022-04-24 20:32:19
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-10 21:04:02
 */
import { V_SHOW } from "../runtimeHelpers";

// 转换v-show
export function transformShow(dir, node, context) {
  return {
    props: [],
    needRuntime: context.helper(V_SHOW),
  };
}
