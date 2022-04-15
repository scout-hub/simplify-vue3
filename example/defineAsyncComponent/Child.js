/*
 * @Author: Zhouqi
 * @Date: 2022-04-14 22:37:53
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-15 19:39:39
 */
import {
    h
} from '../../lib/simplify-vue.esm.js'

export default {
    name: "Child",
    setup() {
        return () => h('div', null, 1);
    },
}