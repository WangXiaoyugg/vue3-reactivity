export function createVnode(type, props:any={}, children=null) {
    // type是什么类型
    const vnode = { //虚拟节点标识dom结构，也可以表示组件
        type,
        props,
        children,
        component: null,
        el: null,
        key: props.key,
        shapFlag: '', // 虚拟节点的类型 元素，文本
    }
    return vnode;
}