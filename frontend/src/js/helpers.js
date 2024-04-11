import router from "./index.js"

export function navigateTo(url) {
    history.pushState(null, null, url)
    router()
}

export function redirectTo(url) {
    history.replaceState(null, null, url)
    router()
}
