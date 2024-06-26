import router from "./index.js"
import {AVATAR_ADDRESS} from "./constants.js";
import {closeSocket} from "./service/socket.js";

export let modalsToCloseList = []

export function navigateTo(url) {
    history.pushState(null, null, url)
    router()
}

export function redirectTo(url) {
    history.replaceState(null, null, url)
    router()
}

export function quit() {
    localStorage.clear();
    closeSocket();
    history.replaceState(null, null, "/login");
    history.pushState(null, null, "/login");
    router();
}

export function formatAvatar(avatar) {
    if (avatar.startsWith("https")) {
        return avatar;
    }

    if (avatar.startsWith("/")) {
        return AVATAR_ADDRESS+avatar;
    }

    return AVATAR_ADDRESS+"/"+avatar;
}

export function getMyID() {
    const token = localStorage.getItem("access-token");
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const data = JSON.parse(jsonPayload);

    return data.user_id;
}

export function getMyDisplayName() {
    const token = localStorage.getItem("access-token");
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const data = JSON.parse(jsonPayload);

    return data.display_name;
}