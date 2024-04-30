import {getGameByID, joinGame} from "../service/game.js";
import {getMe, getUserByID} from "../service/users.js";
import {formatAvatar} from "../helpers.js";

export default class extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        this.gameID = this.getAttribute("game_id");
        this.addEventListener();

        // error

        try {
            const resp = await joinGame(this.gameID);
        } catch (status) {
            this.renderErrorPage();
            return;
        }

        this.me = await getMe();
        this.game = await getGameByID(this.gameID);

        if (this.game.player1.id === this.me.id) {
            this.opponent = await getUserByID(this.game.player2);
        } else {
            this.opponent = await getUserByID(this.game.player1);
        }

        this.render();

        if (this.game.player1.id === this.me.id) {
            this.leftAvatar.src = formatAvatar(this.me.avatar);
            this.rightAvatar.src = formatAvatar(this.opponent.avatar);
        } else {
            this.leftAvatar.src = formatAvatar(this.opponent.avatar);
            this.rightAvatar.src = formatAvatar(this.me.avatar);
        }

        document.title = "Game";
    }

    disconnectedCallback() {
        // send to backend 'quit game'
    }

    render() {
        this.innerHTML = `
        <tr-nav></tr-nav>
        <div class="game-container" style="height: calc(100vh - 56px);">
            <div class="temp-bg">
                <div class="temp-text text-light">Waiting Opponent...</div>
            </div>
            <img id="duel-left-avatar" class="avatar left rounded-circle" src="${formatAvatar(this.me.avatar)}" alt="avatar">
            <img id="duel-right-avatar" class="avatar right rounded-circle" src="404.jpeg" alt="avatar">
            <div class="score">
                <div id="player-score">0</div>
                <div id="computer-score">0</div>
            </div>
            <div class="ball bg-dark" id="ball"></div>
            <div class="paddle left bg-danger" id="player-paddle"></div>
            <div class="paddle right bg-danger" id="computer-paddle"></div>
        </div>
        `;

        this.leftAvatar = this.querySelector("#duel-left-avatar");
        this.rightAvatar = this.querySelector("#duel-right-avatar");
    }

    renderErrorPage() {
        this.innerHTML = `
        <tr-nav></tr-nav>
        <div class="d-flex justify-content-center align-items-center" style="height: calc(100vh - 56px);">
            <h1 style="font-size: 8vw" class="text-danger">No Games Today️🙁</h1>
        </div>
       `
    }
}