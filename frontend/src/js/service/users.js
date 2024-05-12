import {API_ADDRESS} from "../constants.js"
import {withAuthorizationHeader, withJSONContent} from "../middleware.js";
import {formatAvatar, quit} from "../helpers.js";

const GET_USER_API = API_ADDRESS+"/getuser/";
const GET_USER_BY_ID_API = API_ADDRESS+"/userdetail/";
const GET_ME_API = API_ADDRESS+"/me/";
const GET_FRIENDS_API = API_ADDRESS+"/friends/showfriends/";
const GET_USER_FRIENDS_API = API_ADDRESS+"/getfriends/";
const CHANGE_AVATAR_API = API_ADDRESS+"/user/upload_avatar/"
const UPDATE_INFO_API = API_ADDRESS+"/user/updateinfo/"
const SEARCH_USER_API = API_ADDRESS+"/search/"

// FRIENDS AND BLOCK
const UNBLOCK_USER_API = API_ADDRESS+"/unblockuser/";
const BLOCK_USER_API = API_ADDRESS+"/blockuser/";
const APPROVE_FRIEND_API = API_ADDRESS+"/friends/approverequest/";
const REMOVE_FRIEND_API = API_ADDRESS+"/friends/remove/";
const SEND_FRIEND_REQUEST_API = API_ADDRESS+"/friends/sendrequest/";

export async function getMe() {
    const accessToken = localStorage.getItem("access-token") || "";

    let authHeader = {};
    if (accessToken !== "") {
        authHeader = withAuthorizationHeader({}, accessToken);
    }

    const resp = await fetch(GET_ME_API, {
        headers: withJSONContent(authHeader)
    });

    if (!resp.ok) {
        switch (resp.status) {
            case 401:
                return null
        }
    }

    const user = await resp.json();

    return user;

}

export async function getUserByDisplayName(displayName) {
    const accessToken = localStorage.getItem("access-token") || "";

    let authHeader = {};
    if (accessToken !== "") {
        authHeader = withAuthorizationHeader({}, accessToken);
    }

    const resp = await fetch(GET_USER_API+displayName+"/", {
        headers: withJSONContent(authHeader)
    });

    if (!resp.ok) {
        if (resp.status === 404) {
            return null;
        }
    }

    const user = await resp.json();
   
    
    return user;
}

export async function getUserByID(id) {
    const accessToken = localStorage.getItem("access-token") || "";

    let authHeader = {};
    if (accessToken !== "") {
        authHeader = withAuthorizationHeader({}, accessToken);
    }

    const resp = await fetch(GET_USER_BY_ID_API+id+"/", {
        headers: withJSONContent(authHeader)
    });

    if (!resp.ok) {
        if (resp.status === 404) {
            return null;
        }
    }

    const user = await resp.json();

    return user;
}


export async function unblockUser(userID) {
    const accessToken = localStorage.getItem("access-token") || "";

    let authHeader = {};
    if (accessToken !== "") {
        authHeader = withAuthorizationHeader({}, accessToken);
    }

    const req = {
        "blocked_user_id": userID
    }

    const resp = await fetch(UNBLOCK_USER_API, {
        method: "POST",
        headers: withJSONContent(authHeader),
        body: JSON.stringify(req)
    });


    return await resp.json();
}

export async function sendFriendRequest(userID) {
    const accessToken = localStorage.getItem("access-token") || "";

    let authHeader = {};
    if (accessToken !== "") {
        authHeader = withAuthorizationHeader({}, accessToken);
    }

    const req = {
        "receiver_id": userID
    }

    const resp = await fetch(SEND_FRIEND_REQUEST_API, {
        method: "POST",
        headers: withJSONContent(authHeader),
        body: JSON.stringify(req)
    });


    return await resp.json();
}

export async function removeFriend(userID) {
    const accessToken = localStorage.getItem("access-token") || "";

    let authHeader = {};
    if (accessToken !== "") {
        authHeader = withAuthorizationHeader({}, accessToken);
    }

    const req = {
        "remove_user_id": userID
    }

    const resp = await fetch(REMOVE_FRIEND_API, {
        method: "POST",
        headers: withJSONContent(authHeader),
        body: JSON.stringify(req)
    });


    return await resp.json();
}


export async function approveFriendRequest(userID) {
    const accessToken = localStorage.getItem("access-token") || "";

    let authHeader = {};
    if (accessToken !== "") {
        authHeader = withAuthorizationHeader({}, accessToken);
    }

    const req = {
        "sender_id": userID
    }

    const resp = await fetch(APPROVE_FRIEND_API, {
        method: "PUT",
        headers: withJSONContent(authHeader),
        body: JSON.stringify(req)
    });


    return await resp.json();
}


export async function blockUser(userID) {
    const accessToken = localStorage.getItem("access-token") || "";

    let authHeader = {};
    if (accessToken !== "") {
        authHeader = withAuthorizationHeader({}, accessToken);
    }

    const req = {
        "blocked_user_id": userID
    }

    const resp = await fetch(BLOCK_USER_API, {
        method: "POST",
        headers: withJSONContent(authHeader),
        body: JSON.stringify(req)
    });


    return await resp.json();
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

export async function getFriendsOfUser(username, limit, offset) {
    const accessToken = localStorage.getItem("access-token") || "";

    let url = GET_USER_FRIENDS_API+username+"/";

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


    return formatAvatar(data.avatar);
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