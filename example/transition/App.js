/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-17 15:50:07
 */
import {
    h,
    ref,
    Transition
} from "../../lib/simplify-vue.esm.js";

export default {
    name: "App",
    setup() {
        const flag = ref(true);
        window.flag = flag;

        return {
            flag,
        }
    },
    render() {
        return h(Transition, {
            enterFromClass: 'enter-from',
            enterToClass: 'enter-to',
            enterActiveClass: 'enter-active'
        }, {
            default: () => h('div', null, 'transition 组件')
        })
    }
};