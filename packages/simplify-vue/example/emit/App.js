/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-03-30 14:57:36
 */
import {
    h
} from "../../dist/simplify-vue.esm.js";

const Child = {
    name: "Child",
    setup(props, {
        emit
    }) {
        const say = () => {
            emit('sayParent', {
                name: 123
            });
            emit('say-parent', 1, 2, 3);
        };
        return {
            say
        };
    },
    render() {
        return h('button', {
            onClick: this.say
        }, '按钮');
    }
}

export default {
    name: "App",
    setup() {
        const sayParent = (params) => {
            console.log('I am parent', params);
        };
        return {
            msg: 'test123',
            sayParent
        };
    },
    render() {
        return h("div", {
            id: 'div',
        }, [h('div', null, this.msg), h(Child, {
            onSayParent: this.sayParent
        })]);
    }
};