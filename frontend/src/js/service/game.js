import {API_ADDRESS} from "../constants.js";
import {withAuthorizationHeader, withJSONContent} from "../middleware.js";

const CREATE_GAME_API = API_ADDRESS+"/game/create/";
const JOIN_GAME_API = API_ADDRESS+"/game/join/";
const GET_GAME_API = API_ADDRESS+"/game/getinfo/";

// NEW
const GET_STATS_API = API_ADDRESS+"/user/getstats/";
const GET_TOURNAMENT_BY_ID_API = API_ADDRESS+"/tournament/";
const GET_MY_TOURNAMENTS_API = API_ADDRESS+"/tournament/my/";
const PROPOSE_TOURNAMENT_API = API_ADDRESS+"/tournament/propose/";
const ACCEPT_TOURNAMENT_API = API_ADDRESS+"/tournament/accept/";
const DECLINE_TOURNAMENT_API = API_ADDRESS+"/tournament/decline/";
const GET_GAMES_API = API_ADDRESS+"/match/gethistory/";
const GET_GAMES_BY_TOURNAMENT_API = API_ADDRESS+"/game/list/"

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
    if (!resp.ok) {
        if (resp.status === 404) {
            return null;
        }
    }


    return await resp.json();
}

export async function getStatsByID(userID) {
    const accessToken = localStorage.getItem("access-token") || "";

    let authHeader = {};
    if (accessToken !== "") {
        authHeader = withAuthorizationHeader({}, accessToken);
    }

    const resp = await fetch(GET_STATS_API+userID+'/', {
        headers: withJSONContent(authHeader),
    });

    return await resp.json();
}

export async function getMyTournaments() {
    const accessToken = localStorage.getItem("access-token") || "";

    let authHeader = {};
    if (accessToken !== "") {
        authHeader = withAuthorizationHeader({}, accessToken);
    }

    const resp = await fetch(GET_MY_TOURNAMENTS_API, {
        headers: withJSONContent(authHeader),
    });

    return await resp.json();
}

export async function proposeTournament(userIDs) {
    const accessToken = localStorage.getItem("access-token") || "";

    let authHeader = {};
    if (accessToken !== "") {
        authHeader = withAuthorizationHeader({}, accessToken);
    }

    const req = {
        "user_ids": userIDs
    }

    const resp = await fetch(PROPOSE_TOURNAMENT_API, {
        method: "POST",
        headers: withJSONContent(authHeader),
        body: JSON.stringify(req)
    });


    return await resp.json();
}

export async function getMyGames() {
    const accessToken = localStorage.getItem("access-token") || "";

    let authHeader = {};
    if (accessToken !== "") {
        authHeader = withAuthorizationHeader({}, accessToken);
    }

    const resp = await fetch(GET_GAMES_API, {
        headers: withJSONContent(authHeader),
    });
    if (!resp.ok) {
        if (resp.status === 404) {
            return null;
        }
    }


    return await resp.json();
}

export async function getGamesByTournament(ttID) {
    const accessToken = localStorage.getItem("access-token") || "";

    let authHeader = {};
    if (accessToken !== "") {
        authHeader = withAuthorizationHeader({}, accessToken);
    }

    const resp = await fetch(GET_GAMES_BY_TOURNAMENT_API+ttID+"/", {
        headers: withJSONContent(authHeader),
    });
    if (!resp.ok) {
        if (resp.status === 404) {
            return null;
        }
    }


    return await resp.json();
}

export async function approveTournamentInvite(ttID) {
    const accessToken = localStorage.getItem("access-token") || "";

    let authHeader = {};
    if (accessToken !== "") {
        authHeader = withAuthorizationHeader({}, accessToken);
    }

    const req = {
        "tournament_id": ttID,
    }

    const resp = await fetch(ACCEPT_TOURNAMENT_API, {
        method: "PUT",
        headers: withJSONContent(authHeader),
        body: JSON.stringify(req)
    });

    if (!resp.ok) {
        throw resp.status;
    }

    return await resp.json();
}

export async function declineTournamentInvite(ttID) {
    const accessToken = localStorage.getItem("access-token") || "";

    let authHeader = {};
    if (accessToken !== "") {
        authHeader = withAuthorizationHeader({}, accessToken);
    }

    const req = {
        "tournament_id": ttID,
    }

    const resp = await fetch(DECLINE_TOURNAMENT_API, {
        method: "PUT",
        headers: withJSONContent(authHeader),
        body: JSON.stringify(req)
    });

    if (!resp.ok) {
        throw resp.status;
    }

    return await resp.json();
}
