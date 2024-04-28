import {API_ADDRESS} from "../constants.js";
import {withAuthorizationHeader, withJSONContent} from "../middleware.js";

const CREATE_GAME_API = API_ADDRESS+"/game/create/"

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