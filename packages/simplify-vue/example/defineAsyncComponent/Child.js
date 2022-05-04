/*
 * @Author: Zhouqi
 * @Date: 2022-04-14 22:37:53
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-04 13:02:22
 */
const {
    h,
    renderSlot
} = Vue;

export default {
    name: "Child",
    props: {
        text: [String, Number]
    },
    setup(props, {
        slots
    }) {
        console.log(1);
        return () => h('div', null, [h('div', null, props.text), renderSlot(slots, 'body')]);
    },

}