import {API_ADDRESS} from "../constants.js";
import {withAuthorizationHeader, withJSONContent} from "../middleware.js";

const CREATE_GAME_API = API_ADDRESS+"/game/create/";
const JOIN_GAME_API = API_ADDRESS+"/game/join/";
const GET_GAME_API = API_ADDRESS+"/game/getinfo/";

export async function createGame(opponentID) {
    const accessToken = localStorage.getItem("access-token") || "";

    let authHeader = {};
    if (accessToken !== "") {
        authHeader = withAuthorizationHeader({}, accessToken);
    }

    const req = {
        "player2_id": opponentID
    }

    const resp = await fetch(CREATE_GAME_API, {
        method: "POST",
        headers: withJSONContent(authHeader),
        body: JSON.stringify(req)
    });


    return await resp.json();
}

export async function joinGame(gameID) {
    const accessToken = localStorage.getItem("access-token") || "";

    let authHeader = {};
    if (accessToken !== "") {
        authHeader = withAuthorizationHeader({}, accessToken);
    }

    const req = {
        "game_id": gameID,
    }

    const resp = await fetch(JOIN_GAME_API, {
        method: "PUT",
        headers: withJSONContent(authHeader),
        body: JSON.stringify(req)
    });

    if (!resp.ok) {
        throw resp.status;
    }

    return await resp.json();
}

export async function getGameByID(gameID) {
    const accessToken = localStorage.getItem("access-token") || "";

    let authHeader = {};
    if (accessToken !== "") {
        authHeader = withAuthorizationHeader({}, accessToken);
    }

    const resp = await fetch(GET_GAME_API+gameID+'/', {
        headers: withJSONContent(authHeader),
    });


    return await resp.json();
}