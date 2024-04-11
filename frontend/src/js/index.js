import Profile from "./components/Profile.js"
import Login from "./components/Login.js"
import FourZeroFor from "./components/404.js"
import { isLoggedIn } from "./service/auth.js"
import NavBar from "./components/NavBar.js";

customElements.define('tr-login', Login);
customElements.define('tr-not-found', FourZeroFor);
customElements.define('tr-nav', NavBar);
customElements.define('tr-profile', Profile);

const app = document.querySelector("#app");

export default async function router() {
    const routes = [
        { path: "/login", component: "tr-login"},
        { path: "/profile", component: "tr-profile"},
    ]

    let match = routes.find(route => {
        return location.pathname == route.path
    })

    if (!match) {
        match = {
            route: {path: location.pathname, component: "tr-not-found"},
        }
    } else if (!isLoggedIn()) {
        match = {
            route: {path: "/login", component: "tr-login"},
        }

        history.pushState(null, null, "/login")
    }


    app.innerHTML=``;
    app.appendChild(document.createElement(match.route.component));
}

window.addEventListener('popstate', router)

document.addEventListener("DOMContentLoaded", () => {
    router();
})