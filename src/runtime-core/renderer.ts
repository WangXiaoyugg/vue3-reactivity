import { effect } from "../reactivity"
import { ShapeFlags } from "../shared"
import { createAppAPI } from "./apiCreateApp"
import { createComponentInstance, setupComponent } from './component'
import { getSequence } from './getSequence'

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

    const patch = (n1, n2, container, anchor=null) => {
        let { shapeFlag } = n2

        // 老节点和新节点不相同
        if (n1 && !isSameVnodeType(n1, n2)) {
            hostRemove(n1.el)
            n1 = null
        } 

        if (shapeFlag & ShapeFlags.ELEMENT) {
            processElement(n1, n2, container, anchor)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
            processComponent(n1, n2, container)
        }
    }

    const mountElement = (vnode, container, anchor) => {
        // n2 虚拟节点， 真实节点
        let { shapeFlag, props } =  vnode;
        let el = vnode.el = hostCreateElement(vnode.type)
        hostInsert(el, container, anchor)

        if (shapeFlag &  ShapeFlags.TEXT_CHILDREN) {
            hostSetELementText(el, vnode.children)
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(vnode.children, el, anchor)
        }

        if (props) {
            for (let key in props) {
                hostPatchProp(el, key, null, props[key])
            }
        }

        console.log(vnode, container)
    }

    const mountChildren = (children, container, anchor) => {
        for (let i = 0; i < children.length; i++) {
           patch(null, children[i], container, anchor) 
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

    const patchKeyChildren = (c1, c2, el) => {
        // i=0
        let i = 0;
        let e1 = c1.length - 1; //老儿子最后一项的节点
        let e2 = c2.length - 1; //新儿子最后一项的节点
        // abc
        // abde
        while(i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSameVnodeType(n1, n2)) {
                patch(n1, n2, el) // 会递归比对子元素
            } else  {
                break;
            }
            i++;
        }

        // abc
        // dabc
        
        while(i <= e1 && i <= e2) {
            const n1 = c1[e1]
            const n2 = c2[e2]
            if (isSameVnodeType(n1, n2)) {
                patch(n1, n2, el);
            } else {
                break;
            }
            // i, e1, e2, => 0, -1, 0
            e1--;
            e2--;
        }

        // 考虑元素的新增和删除的情况
        // abc
        // abcd (i=3, e1=2 ,e2=3)
        // abc
        // dabc (i=0, e1=-1, e2=0)
        // 只要i 大于 e1, 表示新增属性
        if (i > e1) { // 说明有新增
            if (i <= e2) { // 表示有新增的部分
                // 先根据e2取下一个的元素和数组的长度进行比较
                const nextPos = e2 + 1
                const anchor = nextPos < c2.length ? c2[nextPos].el : null;
                while(i <= e2) {
                    patch(null, c2[i], el, anchor)
                    i++;
                }
            }

        } 
        // abcd  => abc (i=3, e1=3, e2=2)
        else if (i > e2) {
            while(i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            // 无规律的情况 diff算法
            // ab [cdeq] fg // i=2 e1=4
            // ab [edch] fg  // i=2 e2=5, [4,3,2,0]
            const s1 = i
            const s2 = i;
            // 新的索引和key做成一个映射表
            const keyToNewIndexMap = new Map()
            for (let i=s2; i <= e2; i++) {
                const nextChild = c2[i]
                keyToNewIndexMap.set(nextChild.key, i);
            }
            console.log(keyToNewIndexMap);
            const toBePatched = e2 - s2 + 1
            const newIndexToOldMapIndex = new Array(toBePatched).fill(0)
            
            // 只是做相同属性的diff,没有做位置的变化
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i]
                let newIndex = keyToNewIndexMap.get(prevChild.key)
                if (newIndex === undefined) {
                    // 老的有新的没有直接删除掉
                    hostRemove(prevChild.el);
                } else {
                    newIndexToOldMapIndex[newIndex - s2] = i+1;
                    patch(prevChild, c2[newIndex], el)
                }
            }
            console.log(newIndexToOldMapIndex);
            
            // 最长增长序列 [0, 1]
            let increasingIndexSequence = getSequence(newIndexToOldMapIndex)
            let j = increasingIndexSequence.length - 1;

            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = s2 + i; // [edch] 找到h的索引
                const nextChild = c2[nextIndex];  // 找到h
                let anchor = nextIndex + 1 < c2.length ? c2[nextIndex + 1].el:null

                if (newIndexToOldMapIndex[i] === 0) {
                    // 是新元素，直接创建
                    patch(null, nextChild, el, anchor)
                } else {
                    // 根据参照物将节点直接移动过去， 所有节点都要移动，有些节点不需要移动
                    // 没有考虑不动的情况
                    if (j <0 || i != increasingIndexSequence[j]) {
                        hostInsert(nextChild.el, el, anchor)
                    } else {
                        j--
                    }
                }
            }
        }

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
                patchKeyChildren(c1, c2, el);
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

    const processElement = (n1, n2, container, anchor) => {
        if (n1 == null) {
            mountElement(n2, container, anchor)
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