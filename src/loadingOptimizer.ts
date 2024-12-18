import usePage from "./scripts/page/pageManager"
import { relativeToAbsoluteURL } from "./scripts/utils/utils"

const pageCache = usePage()

const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0,
}

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) 
            return

        const targetElement = entry.target

        const href = targetElement.getAttribute("href")

        if (!href)
            return

        const url = relativeToAbsoluteURL(href)
        pageCache.queuePage(url)
    })
}, observerOptions)

async function updateDocument(newHTML: string) {
    const parser = new DOMParser()
    const newPage = parser.parseFromString(newHTML, 'text/html')

    document.body = newPage.body

    document.title = newPage.title

    // for (let element of newPage.head.children) {
    //     if (element instanceof HTMLLinkElement) {
    //         if (element.rel !== "stylesheet")
    //             continue

    //         const newCSSResponse = await fetch(new URL(element.href, document.baseURI).href)
    //         const newCSS = await newCSSResponse.text()

    //         const newStyleSheet = new CSSStyleSheet({baseURL: element.href})
    //         newStyleSheet.replace(newCSS)
    //         console.log(newStyleSheet)
    //     }
    // }  
    // console.log(document.styleSheets)

    // console.log(newPage.scripts)
}

async function goToPage(url: string) {
    let pageInCache = pageCache.getPage(url)

    if (!pageInCache) {
        pageInCache = await pageCache.getAsyncPage(url)
    }

    window.history.pushState({}, '', url)
    updateDocument(pageInCache)
    window.scrollTo(0, 0)

    addLinksObservers()

    return true
}

async function linkClickEvent(event: any) {
    event.preventDefault()
    const target = event.currentTarget

    if (!target)
        return

    const href = target.getAttribute("href")
        
    if (!href) 
        return

    const url = relativeToAbsoluteURL(href)
    const wasSuccess = await goToPage(url)

    if (!wasSuccess)
        window.location.assign(url)
}

function addLinksObservers() {        
    const targetElements = document.getElementsByTagName("a")
    for (let element of targetElements) {
        observer.observe(element)
        element.addEventListener("click", linkClickEvent)
        element.addEventListener("dblclick", linkClickEvent)
    }
}

addLinksObservers()