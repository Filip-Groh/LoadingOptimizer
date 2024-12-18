import useCache from "../cache/cache"
import useProxy from "../utils/proxy"
import useQueue from "../utils/queue"

type PageFetch = {
    url: string,
    state: "queued" | "fetching" | "cached" | "error",
    cacheTimeout: number,
    timestampOfFetch: number,
    htmlString: string | null
}

const usePage = (logging: boolean = false, maxNumberOfConcurrentFetches: number = 5) => {
    const cache = useCache<PageFetch>("page")
    const queue = useQueue<PageFetch>()

    let currentNumberOfConcurrentFetches = 0

    const queuePage = (url: string, cacheTimeout: number = 3600) => {
        const pageCache: Readonly<PageFetch | undefined> = cache.get(url)

        if (pageCache) {
            if (logging)
                console.log("queueExistingPage", pageCache)

            if (pageCache.state === "queued" || pageCache.state === "fetching")
                return

            if (pageCache.timestampOfFetch + pageCache.cacheTimeout * 1000 > Date.now())
                return
        }

        const page: PageFetch = useProxy({
            url: url,
            state: "queued",
            cacheTimeout: cacheTimeout,
            timestampOfFetch: 0,
            htmlString: null
        }, (obj) => cache.set(obj.url, obj))

        if (logging)
            console.log("queueNewPage", page)

        queue.push(page)

        processFetch()
    }

    const processFetch = () => {
        if (currentNumberOfConcurrentFetches >= maxNumberOfConcurrentFetches)
            return

        const pageToFetch = queue.pop()

        if (!pageToFetch) 
            return

        currentNumberOfConcurrentFetches++

        pageToFetch.state = "fetching"
        pageToFetch.timestampOfFetch = Date.now()
        
        let response: Promise<Response> | undefined = undefined
        try {
            response = fetch(pageToFetch.url)
        } catch (error) {
            if (logging)
                console.error("fetchPageError", error)

            pageToFetch.state = "error"
        }

        if (!response)
            return

        if (logging)
            console.log("fetchPage", pageToFetch)

        response.then(async (res) => {
            const pageText = await res.text()

            pageToFetch.htmlString = pageText
            pageToFetch.state = "cached"

            currentNumberOfConcurrentFetches--

            if (logging)
                console.log("cachePage", pageToFetch)

            processFetch()
        })
    }

    const getPage = (url: string) => {
        const page: Readonly<PageFetch | undefined> = cache.get(url)

        if (logging)
            console.log("getPage", page)

        if (!page)
            return

        if (page.state !== "cached" || !page.htmlString)
            return

        return page.htmlString
    }

    const getAsyncPage = async (url: string, cacheTimeout: number = 3600) => {
        const pageCache: Readonly<PageFetch | undefined> = cache.get(url)

        if (pageCache) {
            if (logging)
                console.log("getAsyncExistingPage", pageCache)

            if (pageCache.timestampOfFetch + pageCache.cacheTimeout * 1000 > Date.now() && pageCache.htmlString)
                return pageCache.htmlString
        }

        currentNumberOfConcurrentFetches++

        const page: PageFetch = useProxy({
            url: url,
            state: "fetching",
            cacheTimeout: cacheTimeout,
            timestampOfFetch: 0,
            htmlString: null
        }, (obj) => cache.set(obj.url, obj))

        if (logging)
            console.log("asyncFetchPage", page)
        
        const response = await fetch(url)

        page.timestampOfFetch = Date.now()

        const pageText = await response.text()

        page.htmlString = pageText
        page.state = "cached"

        currentNumberOfConcurrentFetches--

        if (logging)
            console.log("asyncCachePage", page)

        return page.htmlString
    }

    const deleteStoredPages = () => {
        const deletedPageCount = cache.deleteAll()

        if (logging)
            console.log("deleteStoredPages", deletedPageCount)
    }

    return {
        queuePage,
        getPage,
        getAsyncPage,
        deleteStoredPages
    }
}

export default usePage