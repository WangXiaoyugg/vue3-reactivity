// 2 5 8 7 3 4 5 1 6 算个数 = 看那个连续的潜力
// [2]   // 数组是上升的，可以使用二分查找
// [2, 5]
// [2, 5, 8]
// [2, 5, 7]
// [2, 3, 7]
// [2, 3, 4]
// [2, 3, 4, 5]
// [1, 3, 4, 5] // 如果遇到1， 它要插入到底0个，我们需要忽略
// [1,3,4,5,6] => 个数是5

// [0,1,2,3,4,5]
function getSequence(arr) {
    const result = [0]; // 默认以0做为开头
    let p = arr.slice(); // 拷贝一个一模一样的数组
    // i用作循环
    let len = arr.length;
    let i, j, u, v, c;
    for (i = 0; i < len ; i++) {
        const arrI = arr[i];
        // 这里要和最后一项比较
        if (arrI !== 0) {
            j = result[result.length - 1];
            if ( arr[j] < arrI ) {
                p[i] = j  // 将当前数组的最后一项放到p数组中
                result.push(i)
                continue
            }

            // 当前的值比result中的小，去数组找找到后替换
            u = 0;
            v = result.length - 1;
            while(u < v) { // u和v相等则停止
                c = ((u + v) / 2) | 0;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                } else {
                    v = c;
                }
            }
            // u=v
            // 当前要遇到这一个比当前的数组的那个值小
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u-1];
                } 
                result[u] = i; // 这里有可能后面把前面的换掉，导致结果有问题
                
            }
        }
        
    }

    // 用p 覆盖 result的值
    u = result.length;
    v = result[u - 1];
    while(u-- > 0) {
        result[u] = v;
        v = p[v];
    } 

    return result;
}

// let result = getSequence([0,1,2,3,4,0,5])
let result = getSequence([2,5,8,7,3,4,5,1,6])

console.log(result)

