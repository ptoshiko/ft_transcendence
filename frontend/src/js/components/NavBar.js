import { navigateTo } from "../helpers.js";

export default class extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();

        this.profileLink.addEventListener("click", (e)=>{
            e.preventDefault();
            navigateTo("/profile")
        });

        this.chatLink.addEventListener("click", (e)=>{
            e.preventDefault();
            navigateTo("/chat")
        });

        this.gameLink.addEventListener("click", (e)=>{
            e.preventDefault();
            navigateTo("/game")
        });
    }

    render() {
        this.innerHTML = `
            <nav id="menu-bar">
                <a class="nav-profile">Profile</a>
                <a class="nav-game">Game</a>
                <a class="nav-chat">Chat</a>
            </nav>
        `

        this.profileLink = this.querySelector(".nav-profile");
        this.gameLink = this.querySelector(".nav-game");
        this.chatLink = this.querySelector(".nav-chat");
    }
}