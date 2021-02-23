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

    const isSameVnodeType = (n1, n2) => {
        return n1.type === n2.type && n1.key === n2.key;
    }

    const patch = (n1, n2, container) => {
        let { shapeFlag } = n2

        // 老节点和新节点不相同
        if (n1 && !isSameVnodeType(n1, n2)) {
            hostRemove(n1.el)
            n1 = null
        } 

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

    const patchProps = (oldProps, newProps, el) => {
        if (oldProps !== newProps) {
            // 新的需要覆盖老的
            for (let key in newProps) {
                const prev = oldProps[key];
                const next = newProps[key];
                if (prev !== next) {
                    hostPatchProp(el, key, prev, next)
                }
            }

            // 老的有的新的没有，将老的删除掉
            for (let key in oldProps) {
                if (!(key in newProps)) {
                    hostPatchProp(el, key, oldProps[key], null)
                }
            }

            
        }
    }
    
    const patchElement = (n1, n2, container) => {
        // 如何 n1 和 n2 的类型一样，复用老节点，直接改属性
       let el = (n2.el = n1.el)
       const oldProps = n1.props || {};
       const newProps = n2.props || {};

       // 比对前后的属性差异
       patchProps(oldProps, newProps, el); 

       // 比较子节点
       patchChildren(n1, n2, el);

    }

    const patchChildren = (n1, n2, el) =>  {
        // 获取所有老的节点
        const c1 = n1.children;
        // 获取所有新的节点
        const c2 = n2.children;
        const prevShapeFlag = n1.shapeFlag
        const shapeFlag = n2.shapeFlag

        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            // 老的是文本，新的是文本， 新的替换老的
            // 老的是数组，新的是文本， 覆盖老的即可
            if (c2 !== c1) {
                hostSetELementText(el, c2)
            }
        } else {
            // 新的是数组, 老的也是数组，diff算法
            if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                console.log('diff 算法')
            } else {
            // 老的是文本，新的是数组， 移除老的文本，生成新的节点塞进去
                if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                    hostSetELementText(el, '');
                }
                if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                    // 去把新的元素进行挂载
                    for (let i = 0; i < c2.length; i++) {
                        patch(null, c2[i], el);
                    }
                }
            }
        } 

        
        // 老的是数组，新的是数组， diff算法

    }


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
                patch(prev, next, container)
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