import { API_ADDRESS } from "../constants.js"
import { withAuthorizationHeader, withJSONContent } from "../middleware.js";

const GET_USER_API = API_ADDRESS+"/getuser/";
const GET_ME_API = API_ADDRESS+"/me";

export async function getMe() {
    const resp = await fetch(GET_ME_API, {
        headers: withJSONContent(withAuthorizationHeader({}, localStorage.getItem("access-token")))
    });
    const user = await resp.json();

    return user;
}

export async function getUserByDisplayName(displayName) {
    const resp = await fetch(GET_USER_API+displayName, {
        headers: withJSONContent(withAuthorizationHeader({}, localStorage.getItem("access-token")))
    });

    const user = await resp.json();
    
    return user;
}