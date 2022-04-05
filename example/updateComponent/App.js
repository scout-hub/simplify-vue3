/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-05 20:39:19
 */
import {
    h,
    ref
} from "../../lib/my-mini-vue.esm.js";

const Child = {
    name: "Child",
    setup() {},
    render() {
        return h('div', null, this.$props.msg);
    }
}

export default {
    name: "App",
    setup() {
        const msg = ref('msg');
        const msg2 = ref('msg2');
        const click = () => {
            msg.value = 'msg1';
        }
        const click1 = (e) => {
            e.stopPropagation();
            msg2.value = 'msg3';
        }
        return {
            msg,
            msg2,
            click,
            click1
        }
    },
    render() {
        return h("div", {
            onClick: this.click,
        }, [h(Child, {
            msg: this.msg
        }), h('button', {
            onclick: this.click1
        }, '无用更新'), h('div', null, this.msg2)]);
    }
};