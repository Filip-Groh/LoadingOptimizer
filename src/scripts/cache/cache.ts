const useCache = <T>(typeSubPrefix = "any") => {
    const storagePrefix = `loadingOptimizer<${typeSubPrefix}>=`

    const get = (identifier: string) => {
        const pageCacheString = localStorage.getItem(storagePrefix + identifier)

        if (!pageCacheString)
            return

        return JSON.parse(pageCacheString) as T
    }

    const set = (identifier: string, data: T) => {
        localStorage.setItem(storagePrefix + identifier, JSON.stringify(data))
    }

    const remove = (identifier: string) => {
        localStorage.removeItem(identifier)
    }

    const removeAll = () => {
        let deletedPageCount = 0
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i)
            if (key !== null && key.startsWith(storagePrefix)) {
                localStorage.removeItem(key)
                deletedPageCount++
            }
        }
        return deletedPageCount
    }
    
    return {
        get,
        set,
        remove,
        deleteAll: removeAll
    }
}

export default useCache