import Profile from "./components/Profile.js"
import Login from "./components/Login.js"
import FourZeroFor from "./components/404.js"
import { isLoggedIn } from "./service/auth.js"
import NavBar from "./components/NavBar.js";
import UserSmall from "./components/UserSmall.js";

customElements.define('tr-login', Login);
customElements.define('tr-not-found', FourZeroFor);
customElements.define('tr-nav', NavBar);
customElements.define('tr-profile', Profile);
customElements.define('tr-user-small', UserSmall);

const app = document.querySelector("#app");

function pathToRegex(path) {
   return new RegExp("^" + path.replace(/\//g, "\\/").replace(/:\w+/g, "(.+)") + "$");
}

function getParams(result, path) {
    if (!result) {
        return null;
    }

    const values = result.slice(1);
    const keys = Array.from(path.matchAll(/:(\w+)/g)).map(result => result[1]);

    return Object.fromEntries(keys.map((key, i) => {
        return [key, values[i]];
    }));
}

export default async function router() {
    const routes = [
        // { path: "/", component: "tr-profile"},
        { path: "/login", component: "tr-login"},
        { path: "/profiles/:username", component: "tr-profile"},
    ];

    let result = null;
    let route = null;
    for (const r of routes) {
        result = location.pathname.match(pathToRegex(r.path));
        if (result !==null) {
            route = r;
            break;
        }
    }

    if (!route) {
        route = {path: location.pathname, component: "tr-not-found"};
    };

    app.innerHTML=``;
    let component = document.createElement(route.component);

    let params = getParams(result, route.path);
    if (params) {
        for (const [key, value] of Object.entries(params)) {
            component.setAttribute(key, value);
        }
    }
    
    app.appendChild(component);
}

window.addEventListener('popstate', router)

document.addEventListener("DOMContentLoaded", () => {
    router();
})