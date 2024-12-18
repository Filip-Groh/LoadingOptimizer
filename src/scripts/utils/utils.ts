export const relativeToAbsoluteURL = (url: string) => {
    return new URL(url, document.baseURI).href
}