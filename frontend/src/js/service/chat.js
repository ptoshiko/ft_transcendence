import {API_ADDRESS} from "../constants.js"
import {withAuthorizationHeader, withJSONContent} from "../middleware.js";

const GET_CHAT_FRIENDS_LIST_API = API_ADDRESS+"/chat/getlast/";
const GET_CHAT_MESSAGES_API = API_ADDRESS+"/chat/getmessages/";

export async function getChatFriendsList() {
    const accessToken = localStorage.getItem("access-token") || "";

    let authHeader = {};
    if (accessToken !== "") {
        authHeader = withAuthorizationHeader({}, accessToken);
    }

    const resp = await fetch(GET_CHAT_FRIENDS_LIST_API, {
        headers: withJSONContent(authHeader)
    });

    return await resp.json();
}

export async function getChatMessages(displayName) {
    const accessToken = localStorage.getItem("access-token") || "";

    let authHeader = {};
    if (accessToken !== "") {
        authHeader = withAuthorizationHeader({}, accessToken);
    }

    const resp = await fetch(GET_CHAT_MESSAGES_API+displayName+"/", {
        headers: withJSONContent(authHeader)
    });

    return await resp.json();
}