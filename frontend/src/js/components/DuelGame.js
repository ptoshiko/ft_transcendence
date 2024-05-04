import {getGameByID} from "../service/game.js";
import {getMe, getUserByID} from "../service/users.js";
import {formatAvatar} from "../helpers.js";
import {duelDownKey, duelUpKey, joinGame} from "../service/socket.js";

export default class extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        this.addEventListener('join_game', this.getJoinGameEventHandler())
        this.addEventListener('game_tick', this.getGameTickEventHandler())
        this.addEventListener('game_state', this.getGameStateEventHandler())

        this.gameID = this.getAttribute("game_id");
        this.me = await getMe();
        this.game = await getGameByID(this.gameID);
        if (!this.game) {
            this.renderErrorPage()
            return
        }

        if (this.game.player1 !== this.me.id && this.game.player2 !== this.me.id) {
            this.renderErrorPage()
            return
        }

        this.render();

        if (this.game.player1 === this.me.id) {
            this.opponent = await getUserByID(this.game.player2);
        } else {
            this.opponent = await getUserByID(this.game.player1);
        }

        if (this.game.player1 === this.me.id) {
            this.leftAvatar.src = formatAvatar(this.me.avatar);
            this.rightAvatar.src = formatAvatar(this.opponent.avatar);
        } else {
            this.leftAvatar.src = formatAvatar(this.opponent.avatar);
            this.rightAvatar.src = formatAvatar(this.me.avatar);
        }

        joinGame(this.gameID);

        window.addEventListener('keyup', (e) => {
            if (e.key === `ArrowUp`) {
                duelUpKey()
            } else if (e.key === `ArrowDown`) {
                duelDownKey()
            }
        })

        document.title = "Game";
    }

    disconnectedCallback() {
        // send to backend 'quit game'
    }

    render() {
        this.innerHTML = `
        <tr-nav></tr-nav>
        
        <div class="game-wrapper">
        <div class="game-container">
            <div class="game-field">
                <div id="duel-temp-bg" class="temp-bg">
                    <div id="duel-temp-text" class="temp-text text-light">Waiting Opponent...</div>
                </div>
                <div class="ball bg-dark" id="ball"></div>
                <div class="paddle left bg-danger" id="duel-left-paddle"></div>
                <div class="paddle right bg-danger" id="duel-right-paddle"></div>
            </div>
        </div>
        <img id=duel-left-avatar" class="avatar left rounded-circle" src="kanye.webp" alt="avatar">
        <img id=duel-right-avatar" class="avatar right rounded-circle" src="404.jpeg" alt="avatar">
        <div id="duel-left-score" class="score left">0</div>
        <div id="duel-right-score" class="score right">0</div>
    </div>
        `;

        this.leftAvatar = this.querySelector("#duel-left-avatar");
        this.rightAvatar = this.querySelector("#duel-right-avatar");
        this.tempText = this.querySelector("#duel-temp-text")
        this.tempBg = this.querySelector("#duel-temp-bg")
        this.ball = this.querySelector("#duel-ball")
        this.leftPaddle = this.querySelector("#duel-left-paddle")
        this.rightPaddle = this.querySelector("#duel-right-paddle")
        this.leftScore = this.querySelector("#duel-left-score")
        this.rightScore = this.querySelector("#duel-right-score")
    }

    renderErrorPage() {
        this.innerHTML = `
        <tr-nav></tr-nav>
        <div class="d-flex justify-content-center align-items-center" style="height: calc(100vh - 56px);">
            <h1 style="font-size: 8vw" class="text-danger">No Games Today️🙁</h1>
        </div>
       `
    }

    getGameStateEventHandler() {
        return (e) => {
            if (!this.tempText) {
                this.render()
            }

            if (e.detail.is_left_won) {
                this.tempText.style.display = 'block';
                this.tempBg.style.display = 'flex';
                this.tempText.innerHTML = "You Won 🎉"
                return;
            }

            if (e.detail.is_right_won) {
                this.tempText.style.display = 'block';
                this.tempBg.style.display = 'flex';
                this.tempText.innerHTML = "You Lost 💀"
                return;
            }


            this.tempText.style.display = 'none';
            this.tempBg.style.display = 'none';
            this.ball.style.setProperty("--x", e.detail.ball_x)
            this.ball.style.setProperty("--y", e.detail.ball_y)
            this.leftPaddle.style.setProperty("--position", e.detail.left_paddle_y)
            this.rightPaddle.style.setProperty("--position", e.detail.right_paddle_y)
            this.leftScore.innerHTML = e.detail.left_score
            this.rightScore.innerHTML = e.detail.right_score
        }
    }

    getJoinGameEventHandler() {
        return (e) => {
            if (e.detail.error) {
                this.renderErrorPage();
            }
        };
    }

    getGameTickEventHandler() {
        return (e) => {
            if (!this.tempText) {
                this.render()
            }
            this.tempText.innerHTML = e.detail.tick;
        };
    }
}