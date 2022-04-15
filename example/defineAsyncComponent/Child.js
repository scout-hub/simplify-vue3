/*
 * @Author: Zhouqi
 * @Date: 2022-04-14 22:37:53
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-15 20:54:50
 */
import {
    h,
    renderSlot
} from '../../lib/simplify-vue.esm.js'

export default {  name: "Child",
    props: {
        text: [String, Number]
    },
    setup(props, {
        slots
    }) {
        return () => h('div', null, [h('div', null, props.text), renderSlot(slots, 'body')]);
    },
  
}