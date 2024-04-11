import { API_ADDRESS } from "../constants.js"

const GET_USER_API = API_ADDRESS+"/"

export async function getMe() {
    const resp = await fetch(GET_USER_API);
    const user = await resp.json();
    
    return user;
}

export function getUserByDisplayName(login) {

}