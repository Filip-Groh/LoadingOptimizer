const useProxy = <T extends object>(target: T, updateFunction: (updatedObject: T) => void, callUpdateFunctionWhenConstructed = true) => {
    if (callUpdateFunctionWhenConstructed)
        updateFunction(target)

    return new Proxy(target, {
        set(target, propertyKey, newValue, receiver) {
            Reflect.set(target, propertyKey, newValue, receiver)
            updateFunction(target)
            return newValue
        }
    })
}

export default useProxy