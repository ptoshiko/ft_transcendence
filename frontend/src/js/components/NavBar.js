import { navigateTo, quit } from "../helpers.js";

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

        this.quitLink.addEventListener("click", (e)=>{
            e.preventDefault();
            quit();
        });
    }

    render() {
        this.innerHTML = `
            <nav class="nav-container">
                <ul id="menu-bar">
                    <li class="nav-profile"><a>Profile</a></li>
                    <li class="nav-game"><a>Game</a></li>
                    <li class="nav-chat"><a>Chat</a></li>
                    <li class="nav-quit"><a>Quit</a></li>
                </ul>
            </nav>
        `

        this.profileLink = this.querySelector(".nav-profile");
        this.gameLink = this.querySelector(".nav-game");
        this.chatLink = this.querySelector(".nav-chat");
        this.quitLink = this.querySelector(".nav-quit");
    }
}