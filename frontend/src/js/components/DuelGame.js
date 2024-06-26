import {getGameByID} from "../service/game.js";
import {getMe, getUserByID} from "../service/users.js";
import {formatAvatar, redirectTo} from "../helpers.js";
import {duelDownKey, duelUpKey, joinGame} from "../service/socket.js";

export default class extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        const me = await getMe()
        if (!me) {
            redirectTo("/login")
            return
        }

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
            this.am_left = true
            this.opponent = await getUserByID(this.game.player2);
            this.leftAvatar.src = formatAvatar(this.me.avatar);
            this.rightAvatar.src = formatAvatar(this.opponent.avatar);
        } else {
            this.am_right = true
            this.opponent = await getUserByID(this.game.player1);
            this.leftAvatar.src = formatAvatar(this.opponent.avatar);
            this.rightAvatar.src = formatAvatar(this.me.avatar);
        }

        if (this.game.won_id && this.game.won_id === this.me.id) {
            this.setWonPageAttributes(this.game.player1_score, this.game.player2_score);
        } else if (this.game.won_id && this.game.won_id !== this.me.id) {
            this.setLostPageAttributes(this.game.player1_score, this.game.player2_score);
        }

        joinGame(this.gameID);

        window.addEventListener('keyup', (e) => {
            if (e.key === `ArrowUp`) {
                this.isUpPressed = false
                // duelUpKey()
            } else if (e.key === `ArrowDown`) {
                this.isDownPressed = false
                // duelDownKey()
            }
        })

        window.addEventListener('keydown', (e) => {
            if (e.key === `ArrowUp`) {
                this.isUpPressed = true
            } else if (e.key === `ArrowDown`) {
                this.isDownPressed = true
            }
        })

        this.setIntervalID = setInterval(this.getMovePaddleHandler(), 10)

        document.title = "Game";
    }

    disconnectedCallback() {
        if (this.setIntervalID) {
            clearInterval(this.setIntervalID)
        }
        // send to backend 'quit game'
    }

    render() {
        this.innerHTML = `
        <tr-nav></tr-nav>
        
        <div class="game-wrapper">
        <div class="game-container">
            <div class="game-field">
                <div class="ball bg-dark" id="duel-ball"></div>
                <div class="paddle left bg-danger" id="duel-left-paddle"></div>
                <div class="paddle right bg-danger" id="duel-right-paddle"></div>
            </div>
        </div>
        <div id="duel-temp-bg" class="temp-bg">
            <div id="duel-temp-text" class="temp-text text-light">Waiting Opponent...</div>
        </div>
        <img id="duel-left-avatar" class="avatar left rounded-circle" alt="avatar">
        <img id="duel-right-avatar" class="avatar right rounded-circle" alt="avatar">
        <div id="duel-left-score" class="score left">0</div>
        <div id="duel-right-score" class="score right">0</div>
    </div>`;

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

    setWonPageAttributes(leftScore, rightScore) {
        this.tempText.style.display = 'block';
        this.tempBg.style.display = 'flex';
        this.tempText.innerHTML = "You Won 🎉"
        this.leftScore.innerHTML = leftScore
        this.rightScore.innerHTML = rightScore
    }

    setLostPageAttributes(leftScore, rightScore) {
        this.tempText.style.display = 'block';
        this.tempBg.style.display = 'flex';
        this.tempText.innerHTML = "You Lost 💀"
        this.leftScore.innerHTML = leftScore
        this.rightScore.innerHTML = rightScore
    }

    getGameStateEventHandler() {
        return (e) => {
            if (!this.tempText) {
                this.render()
            }

            if ((e.detail.is_left_won && this.am_left) || (e.detail.is_right_won && this.am_right)) {
                this.setWonPageAttributes(e.detail.left_score, e.detail.right_score);
                return;
            }

            if ((e.detail.is_right_won && this.am_left) || (e.detail.is_left_won && this.am_right)) {
                this.setLostPageAttributes(e.detail.left_score, e.detail.right_score);
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

    getMovePaddleHandler() {
        return () => {
            if (this.isUpPressed) {
                duelUpKey()
            }
            if (this.isDownPressed) {
                duelDownKey()
            }
        }
    }
}