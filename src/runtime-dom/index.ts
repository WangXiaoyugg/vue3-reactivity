import { createRenderer }from '../runtime-core/index'
import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp';

const renderOptions = { ...nodeOps, patchProp }

export function createApp(rootComponent) {
    return ensureRenderer(rootComponent);
}

function ensureRenderer(rootComponent) {
    const app = createRenderer(renderOptions).createApp(rootComponent)
    const { mount } = app;
    app.mount = function (container) {
        // 挂载前先把容器清空
        container.innerHTML = ''
        mount(container)
    }
    return app
}