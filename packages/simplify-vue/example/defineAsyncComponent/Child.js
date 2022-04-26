/*
 * @Author: Zhouqi
 * @Date: 2022-04-14 22:37:53
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-16 10:39:04
 */
import {
    h,
    renderSlot
} from '../../dist/simplify-vue.esm.js'

export default {
    name: "Child",
    props: {
        text: [String, Number]
    },
    setup(props, {
        slots
    }) {
        return () => h('div', null, [h('div', null, props.text), renderSlot(slots, 'body')]);
    },

}