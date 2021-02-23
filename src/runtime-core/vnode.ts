import { isArray, isObject, isString, ShapeFlags } from '../shared'
export function createVnode(type, props:any={}, children=null) {
    // type是什么类型
    const shapeFlag = isString(type) ? ShapeFlags.ELEMENT :
        isObject(type) ? ShapeFlags.STATEFUL_COMPONENT : 0;

    const vnode = { //虚拟节点标识dom结构，也可以表示组件
        type,
        props,
        children,
        component: null,
        el: null,
        key: props.key,
        shapeFlag: shapeFlag, // 虚拟节点的类型 元素，文本
    }

    if (isArray(children)) {
        vnode.shapeFlag |=  ShapeFlags.ARRAY_CHILDREN
    } else {
        vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN
    }
    
    return vnode;
}