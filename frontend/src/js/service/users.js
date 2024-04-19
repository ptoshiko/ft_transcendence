import {API_ADDRESS} from "../constants.js"
import {withAuthorizationHeader, withJSONContent} from "../middleware.js";

const GET_USER_API = API_ADDRESS+"/getuser/";
const GET_ME_API = API_ADDRESS+"/me";
const GET_FRIENDS_API = API_ADDRESS+"/friends/showfriends/";
const CHANGE_AVATAR_API = API_ADDRESS+"/user/upload_avatar/"
const UPDATE_INFO_API = API_ADDRESS+"/user/updateinfo/"
const SEARCH_USER_API = API_ADDRESS+"/search/"

export async function getMe() {
    const accessToken = localStorage.getItem("access-token") || "";

    let authHeader = {};
    if (accessToken !== "") {
        authHeader = withAuthorizationHeader({}, accessToken);
    }

    const resp = await fetch(GET_ME_API, {
        headers: withJSONContent(authHeader)
    });

    const user = await resp.json();

    return user;
}

export async function getUserByDisplayName(displayName) {
    const accessToken = localStorage.getItem("access-token") || "";

    let authHeader = {};
    if (accessToken !== "") {
        authHeader = withAuthorizationHeader({}, accessToken);
    }

    const resp = await fetch(GET_USER_API+displayName, {
        headers: withJSONContent(authHeader)
    });

    if (!resp.ok) {
        if (resp.status == 404) {
            return null;
        }
    }

    const user = await resp.json();
   
    
    return user;
}

export async function searchUsers(input) {
    if (input==="") {
        return [];
    }
    const accessToken = localStorage.getItem("access-token") || "";

    let authHeader = {};
    if (accessToken !== "") {
        authHeader = withAuthorizationHeader({}, accessToken);
    }

    const resp = await fetch(SEARCH_USER_API+input+"/", {
        headers: withJSONContent(authHeader)
    });

    // if (!resp.ok) {
    //     if (resp.status == 404) {
    //         return null;
    //     }
    // }

    const users = await resp.json();


    return users;
}

export async function getFriends(limit, offset) {
    const accessToken = localStorage.getItem("access-token") || "";

    let url = GET_FRIENDS_API;

    if (limit != null && offset != null) {
        url += `?limit=${limit}&offset=${offset}`;
    }

    let authHeader = {};
    if (accessToken !== "") {
        authHeader = withAuthorizationHeader({}, accessToken);
    }

    const resp = await fetch(url, {
        headers: withJSONContent(authHeader)
    });

    const friends = await resp.json();

    return friends;
}

export async function uploadAvatar(avatarFile) {
    const accessToken = localStorage.getItem("access-token") || "";

    let authHeader = {};
    if (accessToken !== "") {
        authHeader = withAuthorizationHeader({}, accessToken);
    }

    const formData = new FormData();
    formData.append('avatar', avatarFile); 

    const resp = await fetch(CHANGE_AVATAR_API, {
        method: 'POST',
        headers: authHeader,
        body: formData,
    });

    const data = await resp.json();

    return "https://localhost:8081"+data.avatar;
}

export async function updateInfo(body) {
    const accessToken = localStorage.getItem("access-token") || "";

    let authHeader = {};
    if (accessToken !== "") {
        authHeader = withAuthorizationHeader({}, accessToken);
    }

    const resp = await fetch(UPDATE_INFO_API, {
        method: 'PUT',
        headers: withJSONContent(authHeader),
        body: body,
    });

    if (!resp.ok) {
        if (resp.status === 400) {
            const errors = await resp.json();
            throw(errors);
        }
    }

    return await resp.json();
}