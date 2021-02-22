export const nodeOps = {
    createElement(type) {
        return document.createElement(type)
    },
    setElementText(el, text) {
        el.textContent = text
    },
    insert(child, parent, anchor=null) {
        // anchor为null, 默认为appendChild
        parent.insertBefore(child, parent, anchor)
    },
    remove(child) {
        const parent = child.parentNode
        if (parent) {
            parent.removeChild(child)
        }
    }

}