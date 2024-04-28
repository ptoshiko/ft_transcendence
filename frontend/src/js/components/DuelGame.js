export default class extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();

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
            <img class="avatar left rounded-circle" src="kanye.webp" alt="avatar">
            <img class="avatar right rounded-circle" src="404.jpeg" alt="avatar">
            <div class="score">
                <div id="player-score">0</div>
                <div id="computer-score">0</div>
            </div>
            <div class="ball bg-dark" id="ball"></div>
            <div class="paddle left bg-danger" id="player-paddle"></div>
            <div class="paddle right bg-danger" id="computer-paddle"></div>
        </div>
        `;
    }
}