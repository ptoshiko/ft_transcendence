import router from "./index.js"

export function navigateTo(url) {
    history.pushState(null, null, url)
    router()
}

export function redirectTo(url) {
    history.replaceState(null, null, url)
    router()
}

export function quit() {
    localStorage.removeItem("access-token");
    localStorage.removeItem("refresh-token");
    history.replaceState(null, null, "/login");
    history.pushState(null, null, "/login");
    router();
}