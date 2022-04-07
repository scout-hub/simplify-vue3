/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-07 21:14:20
 */
import {
    h,
    ref,
    onUpdated
} from "../../lib/simplify-vue.esm.js";

const Child = {
    name: "Child",
    props: {
        msg: {
            type: Boolean
        },
        name: {
            type: String,
            default: 1
        }
    },
    setup(props) {
        onUpdated(() => {
            console.log(props);
        })
    },
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
            b.value = false;
        }
        const click1 = (e) => {
            e.stopPropagation();
            msg2.value = 'msg3';
        }

        const b = ref(true);

        return {
            b,
            msg,
            msg2,
            click,
            click1
        }
    },
    render() {
        return h("div", {
            onClick: this.click,
        }, [h(Child, this.b ? {
            msg: this.msg,
            name: '123',
            class: this.msg === 'msg1' ? 'update' : 'render'
        } : {
            msg: this.msg
        }), h('button', {
            onclick: this.click1
        }, '无用更新'), h('div', null, this.msg2)]);
    }
};