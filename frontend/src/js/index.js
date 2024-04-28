import Profile from "./components/Profile.js"
import Login from "./components/Login.js"
import FourZeroFor from "./components/404.js"
import NavBar from "./components/NavBar.js";
import UserSmall from "./components/UserSmall.js";
import Chat from "./components/Chat.js";
import ChatFriend from "./components/ChatFriend.js";
import ChatMessageToMe from "./components/ChatMessageToMe.js";
import MyChatMessage from "./components/MyChatMessage.js";
import {getMe} from "./service/users.js";
import {redirectTo} from "./helpers.js";
import {initSocket} from "./service/socket.js";
import DuelGame from "./components/DuelGame.js";

customElements.define('tr-login', Login);
customElements.define('tr-not-found', FourZeroFor);
customElements.define('tr-nav', NavBar);
customElements.define('tr-profile', Profile);
customElements.define('tr-chat', Chat);
customElements.define('tr-user-small', UserSmall);
customElements.define('tr-chat-msg-to-me', ChatMessageToMe);
customElements.define('tr-chat-my-msg', MyChatMessage);
customElements.define('tr-chat-friend', ChatFriend);
customElements.define('tr-duel-game', DuelGame);

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

export default async function router(firstMe) {
    let route = null;
    let result = null;
    const routes = [
        { path: "/", component: "tr-profile"},
        { path: "/login", component: "tr-login"},
        { path: "/profiles/:username", component: "tr-profile"},
        { path: "/chat", component: "tr-chat"},
        { path: "/chat/:username", component: "tr-chat"},
        { path: "/games/:game_id", component: "tr-duel-game"},
    ];

    for (const r of routes) {
        result = location.pathname.match(pathToRegex(r.path));
        if (result !== null) {
            route = r;
            break;
        }
    }

    if (!route) {
        route = {path: location.pathname, component: "tr-not-found"};
    }

    app.innerHTML=``;
    let component = document.createElement(route.component);

    let params = getParams(result, route.path);
    if (params) {
        for (const [key, value] of Object.entries(params)) {
            component.setAttribute(key, value);
        }
    }

    if (firstMe) {
        component.setAttribute('first-me', JSON.stringify(firstMe));
    }

    app.appendChild(component);
}

window.addEventListener('popstate', router)

document.addEventListener("DOMContentLoaded",async () => {
    const me = await getMe();
    if (!me) {
        // location.replace("/login");
        // router();
        redirectTo("/login");
    } else {
        initSocket();
        router(me);
    }
})