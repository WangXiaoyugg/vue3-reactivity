import { isFunction } from "../shared";

export function createComponentInstance(vnode) {
    const instance = {
        type: vnode.type,
        props: {},
        vnode,
        render: null,
        setupState: null,
        isMounted: false,
    }

    return instance
}

export function setupComponent(instance) {

    setupStatefulComponent(instance)
}

function setupStatefulComponent(instance) {
    const Component = instance.type;
    const { setup } = Component;
    if (setup) {
       const setupResult = setup()
       // 判断返回值类型
       handleSetupResult(instance, setupResult);
    }
}

function handleSetupResult(instance, setupResult) {
    if (isFunction(setupResult)) {
        instance.render = setupResult
    } else {
        instance.setupState = setupResult
    }

    finishComponentSetup(instance)
}

function finishComponentSetup(instance) {
    const Component = instance.type
    if (Component.render) {
        instance.render = Component.render;
    } else if (!instance.render) {
        // compile(Component.template) 编译成render函数
    }

    // applyOptions(), vue2和 vue3的setup返回的结果做合并操作
    
}