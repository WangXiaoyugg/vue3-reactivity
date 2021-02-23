import { effect } from "../reactivity"
import { ShapeFlags } from "../shared"
import { createAppAPI } from "./apiCreateApp"
import { createComponentInstance, setupComponent } from './component'

export function createRenderer(options) {
    return baseCreateRenderer(options)
    
}
function baseCreateRenderer(options) {
    const { 
        createElement: hostCreateElement,
        patchProp: hostPatchProp,
        setElementText: hostSetELementText,
        insert: hostInsert,
        remove: hostRemove
     } = options
    const render = (vnode, container) => {
       patch(null, vnode, container)
    }

    const patch = (n1, n2, container) => {
        let { shapeFlag } = n2

        if (shapeFlag & ShapeFlags.ELEMENT) {
            processElement(n1, n2, container)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
            processComponent(n1, n2, container)
        }
    }

    const mountElement = (vnode, container) => {
        // n2 虚拟节点， 真实节点
        let { shapeFlag, props } =  vnode;
        let el = vnode.el = hostCreateElement(vnode.type)
        hostInsert(el, container)

        if (shapeFlag &  ShapeFlags.TEXT_CHILDREN) {
            hostSetELementText(el, vnode.children)
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(vnode.children, el)
        }

        if (props) {
            for (let key in props) {
                hostPatchProp(el, key, null, props[key])
            }
        }

        console.log(vnode, container)
    }

    const mountChildren = (children, container) => {
        for (let i = 0; i < children.length; i++) {
           patch(null, children[i], container) 
        }
    }
    
    const patchElement = (n1, n2, container) => {}

    const mountComponent = (initialVnode, container) => {
       const instance = initialVnode.component = createComponentInstance(initialVnode)
       setupComponent(instance) 
       
       setupRenderEffect(instance, initialVnode, container); // 给组件创建一个effect用于渲染
    }

    const setupRenderEffect = (instance, initialVnode, container) => {
        effect(function componentEffect() {
            if (!instance.isMounted) {
                // 选择组件中的内容
                const subTree = instance.subTree = instance.render()
                patch(null, subTree, container)
                instance.isMounted = true;
            } else {
                // 更新逻辑
                let prev = instance.subTree;
                let next = instance.render();
                console.log(prev, next);
            }
        })
    }

    const updateComponent = (n1, n2, container) => {}

    const processElement = (n1, n2, container) => {
        if (n1 == null) {
            mountElement(n2, container)
        } else {
            patchElement(n1, n2, container)
        }
    }

    const processComponent = (n1, n2, container) => {
        if (n1 == null) {
            mountComponent(n2, container)
        } else {
            updateComponent(n1, n2, container)
        }
    }



    return {
        createApp: createAppAPI(render),
    }
}