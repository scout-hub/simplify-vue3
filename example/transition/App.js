/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-17 19:42:53
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
        return this.flag ? h(Transition, {
                enterFromClass: 'enter-from',
                enterToClass: 'enter-to',
                enterActiveClass: 'enter-active',
                leaveFromClass: 'leave-from',
                leaveToClass: 'leave-to',
                leaveActiveClass: 'leave-active'
            }, {
                default: () =>
                    h('div', null, 'transition 组件')
            }) :
            null
    }
};