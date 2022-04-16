/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-16 09:35:36
 */
import {
    h,
    ref
} from "../../lib/simplify-vue.esm.js";


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

        // 3. 旧的是数组，新的不存在
        // return this.update ? h("div") : h("div", {
        //     onClick: this.change,
        // }, [h('div', null, 'asd'), h('div', null, 'xxx')]);

        // 4. 旧的是文本，新的不存在
        // return this.update ? h("div") : h("div", {
        //     onClick: this.change,
        // }, this.count);

        // 5. 旧的是文本，新的是数组
        // return this.update ? h("div", null, [h('div', null, 'asd'), h('div', null, 'xxx')]) : h("div", {
        //     onClick: this.change,
        // }, this.count);

        // 6. 新旧都是数组 dom diff

        // 6.1 相同前置节点且有需要新增的节点 (a b) ====> (a b) c d
        // return this.update ?
        //     h("div", null, [h('div', {
        //         key: 1
        //     }, '1'), h('div', {
        //         key: 2
        //     }, '2'), h('div', {
        //         key: 3
        //     }, '3'), h('div', {
        //         key: 4
        //     }, '4')]) :
        //     h("div", {
        //         onClick: this.change,
        //     }, [h('div', {
        //         key: 1
        //     }, '1'), h('div', {
        //         key: 2
        //     }, '22')]);

        // 6.2 相同前置节点且有需要新增的节点 (a b) ====> c d (a b)
        // return this.update ?
        //     h("div", null, [
        //         h('div', {
        //             key: 3
        //         }, '3'),
        //         h('div', {
        //             key: 4
        //         }, '4'),
        //         h('div', {
        //             key: 1
        //         }, '1'),
        //         h('div', {
        //             key: 2
        //         }, '2')
        //     ]) :
        //     h("div", {
        //         onClick: this.change,
        //     }, [h('div', {
        //         key: 1
        //     }, '1'), h('div', {
        //         key: 2
        //     }, '22')]);

        // 6.3 相同前置和后置节点且有需要新增的节点 (a b) (e) ====> (a b) c d (e)
        // return this.update ?
        //     h("div", null, [
        //         h('div', {
        //             key: 1
        //         }, '1'),
        //         h('div', {
        //             key: 2
        //         }, '2'),
        //         h('div', {
        //             key: 3
        //         }, '3'),
        //         h('div', {
        //             key: 4
        //         }, '4'),
        //         h('div', {
        //             key: 5
        //         }, '5')
        //     ]) :
        //     h("div", {
        //         onClick: this.change,
        //     }, [h('div', {
        //             key: 1
        //         }, '1'),
        //         h('div', {
        //             key: 2
        //         }, '22'),
        //         h('div', {
        //             key: 5
        //         }, '5')
        //     ]);

        // 6.4 相同前置节点，且需要删除元素
        // return this.update ?
        //     h("div", null, [
        //         h('div', {
        //             key: 1
        //         }, '1'),
        //         h('div', {
        //             key: 2
        //         }, '2')
        //     ]) :
        //     h("div", {
        //         onClick: this.change,
        //     }, [h('div', {
        //             key: 1
        //         }, '1'),
        //         h('div', {
        //             key: 2
        //         }, '2'),
        //         h('div', {
        //             key: 3
        //         }, '3')
        //     ]);

        // 6.5 相同的后置节点，且需要删除元素
        // return this.update ?
        //     h("div", null, [
        //         h('div', {
        //             key: 1
        //         }, '1'),
        //         h('div', {
        //             key: 2
        //         }, '2')
        //     ]) :
        //     h("div", {
        //         onClick: this.change,
        //     }, [
        //         h('div', {
        //             key: 3
        //         }, '3'),
        //         h('div', {
        //             key: 1
        //         }, '1'),
        //         h('div', {
        //             key: 2
        //         }, '2')
        //     ]);

        // 6.6 相同的前置和后置节点，且需要删除元素
        // return this.update ?
        //     h("div", {
        //         key: 1
        //     }, [
        //         h('div', {
        //             key: 1
        //         }, '1'),
        //         h('div', {
        //             key: 2
        //         }, '2'),
        //         h('div', {
        //             key: 4
        //         }, '4'),
        //     ]) :
        //     h("div", {
        //         key: 1,
        //         onClick: this.change,
        //     }, [
        //         h('div', {
        //             key: 1
        //         }, '1'),
        //         h('div', {
        //             key: 2
        //         }, '2'),
        //         h('div', {
        //             key: 3
        //         }, '3'),
        //         h('div', {
        //             key: 4
        //         }, '4'),
        //     ]);

        // 6.7 复杂子节点数组更新，存在既有删除又有新增元素但是无需要移动节点的情况
        return this.update ?
            h("div", {
                key: 1
            }, [
                h('div', {
                    key: 1
                }, '1'),
                h('div', {
                    key: 3
                }, '3'),
                h('div', {
                    key: 4
                }, '4'),
                h('div', {
                    key: 2,
                    class: 'xx'
                }, '2'),
                h('div', {
                    key: 7
                }, '7'),
                h('div', {
                    key: 5
                }, '5')
            ]) :
            h("div", {
                onClick: this.change,
                key: 1
            }, [
                h('div', {
                    key: 1,
                }, '1'),
                h('div', {
                    key: 2
                }, '2'),
                h('div', {
                    key: 3
                }, '3'),
                h('div', {
                    key: 4
                }, '4'),
                h('div', {
                    key: 6
                }, '6'),
                h('div', {
                    key: 5
                }, '5'),

            ]);
    }
};