/*
 * @Author: Zhouqi
 * @Date: 2022-04-24 20:32:19
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-24 20:36:48
 */
import { V_SHOW } from "../runtimeHelpers";

// 转换v-show
export function transformShow(dir, context) {
  return {
    props: [],
    needRuntime: context.helper(V_SHOW),
  };
}
