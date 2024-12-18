const useQueue = <T>() => {
    const queue = new Array<T>()

    const push = (element: T) => {
        queue.push(element)
    }

    const pop = () => {
        return queue.shift()
    }

    return {
        push,
        pop
    }
}

export default useQueue