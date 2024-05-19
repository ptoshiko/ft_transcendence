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
import {modalsToCloseList, redirectTo} from "./helpers.js";
import {initSocket} from "./service/socket.js";
import DuelGame from "./components/DuelGame.js";
import Game from "./components/Game.js";
import AddedToTournamentUser from "./components/AddedToTournamentUser.js";
import UserSmallTournament from "./components/UserSmallTournament.js";
import TournamentSmall from "./components/TournamentSmall.js";
import MatchSmall from "./components/MatchSmall.js";
import Tournament from "./components/Tournament.js";

customElements.define('tr-login', Login);
customElements.define('tr-not-found', FourZeroFor);
customElements.define('tr-nav', NavBar);
customElements.define('tr-profile', Profile);
customElements.define('tr-chat', Chat);
customElements.define('tr-user-small', UserSmall);
customElements.define('tr-user-small-tournament', UserSmallTournament);
customElements.define('tr-chat-msg-to-me', ChatMessageToMe);
customElements.define('tr-chat-my-msg', MyChatMessage);
customElements.define('tr-chat-friend', ChatFriend);
customElements.define('tr-duel-game', DuelGame);
customElements.define('tr-game', Game);
customElements.define('tr-added-to-tournament', AddedToTournamentUser);
customElements.define('tr-tournament-small', TournamentSmall);
customElements.define('tr-match-small', MatchSmall);
customElements.define('tr-tournament', Tournament);

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
    for (const toClose of modalsToCloseList) {
        $(`#${toClose}`).modal('hide')
    }

    while (modalsToCloseList.length > 0) {
        modalsToCloseList.pop();
    }

    const routes = [
        { path: "/", component: "tr-profile"},
        { path: "/login", component: "tr-login"},
        { path: "/profiles/:username", component: "tr-profile"},
        { path: "/game", component: "tr-game"},
        { path: "/chat", component: "tr-chat"},
        { path: "/chat/:username", component: "tr-chat"},
        { path: "/games/:game_id", component: "tr-duel-game"},
        { path: "/tournaments/:tournament_id", component: "tr-tournament"},
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

    const me = await getMe()
    if (!me && !firstMe) {
        console.log('check')
        component = document.createElement("tr-login")
    }

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