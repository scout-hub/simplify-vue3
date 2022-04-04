/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-04 21:21:14
 */
import {
    h,
    ref
} from "../../lib/my-mini-vue.esm.js";


export default {
    name: "App",
    setup() {
        const count = ref(1);
        let update = ref(false);

        // 2.
        // const change = () => {
        //     count.value++;
        // };

        const change = () => {
            update.value = true;
        };

        return {
            count,
            change,
            update
        };
    },
    render() {
        // 1. 新的是文本，旧的是数组
        // return this.update ? h("div", null, 'xxxx') : h("div", {
        //     onClick: this.change,
        // }, [h('div', null, 'asd'), h('div', null, 'xxx')]);

        // 2. 新旧都是文本节点
        // return h("button", {
        //     onClick: this.change,
        // }, this.count);

        // 3. 新旧都是数组


        // 4. 旧的是数组，新的不存在
        // return this.update ? h("div") : h("div", {
        //     onClick: this.change,
        // }, [h('div', null, 'asd'), h('div', null, 'xxx')]);

        // 5. 旧的是文本，新的不存在
        // return this.update ? h("div") : h("div", {
        //     onClick: this.change,
        // }, this.count);

        // 6. 旧的是文本，新的是数组
        return this.update ? h("div", [h('div', null, 'asd'), h('div', null, 'xxx')]) : h("div", {
            onClick: this.change,
        }, this.count);
    }
};