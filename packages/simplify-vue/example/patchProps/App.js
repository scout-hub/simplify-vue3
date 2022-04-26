/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-04 15:18:39
 */
import {
    h,
    ref
} from "../../dist/simplify-vue.esm.js";

export default {
    name: "App",
    setup() {
        const classObj = ref({
            red: 'red',
            green: 'green'
        });

        const change = () => {
            classObj.value.green = 'green1';
        };
        const change1 = () => {
            classObj.value.green = null;
        };
        const change2 = () => {
            classObj.value = {
                red: 'red1',
            }
        };

        return {
            classObj,
            change,
            change1,
            change2
        };
    },
    render() {
        return h("div", {
            // class: this.classObj // 这种情况在更新的时候有问题，待解决
            ...this.classObj
        }, [h('button', {
                onClick: this.change,
            }, '新旧属性值存在但是不一样'),
            h('button', {
                onClick: this.change1,
            }, '新的值不存在'),
            h('button', {
                onClick: this.change2,
            }, '旧的key在新的上不存在')
        ]);
    }
};