/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-16 21:26:33
 */
import {
    h,
    renderSlot,
    ref,
    KeepAlive,
    createTextVnode
} from "../../lib/simplify-vue.esm.js";

const Child = {
    name: "Child",
    setup() {},
    props: ['text'],
    render() {
        // let value = '';
        return h('div', null, [h('input', {
            // value,
            // onchange: (e) => {
            //     value = e.target.value
            // }
        }), createTextVnode(`I am a ${this.$props.text} keep-alive component`)])
    }
}

let key = 1;
let i = 0

export default {
    name: "App",
    setup() {
        const flag = ref(true);
        window.flag = flag;
        return {
            flag
        }
    },
    render() {
        this.flag ? key++ : key--;
        i++;
        return h(KeepAlive, null, {
            default: () => this.flag ?
                h(Child, {
                    key,
                    text: 'old' + i
                }) : h(Child, {
                    key,
                    text: 'new'
                })
        });
    }
};