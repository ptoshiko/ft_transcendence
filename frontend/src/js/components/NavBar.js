import { navigateTo, quit } from "../helpers.js";

export default class extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();

        const username  = this.getAttribute("username");

        this.profileLink.addEventListener("click", (e)=>{
            e.preventDefault();
            navigateTo(`/profiles/${username}`)
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
        <nav class="navbar navbar-expand-lg navbar-light bg-light">
            <a class="navbar-brand text-under" href="#">Trancendance</a>

            <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
            </button>
        
            <div class="collapse navbar-collapse" id="navbarSupportedContent">
            <ul class="navbar-nav mr-auto">
                <li class="nav-item active" id="nav-profile">
                <a class="nav-link" href="#">My Profile<span class="sr-only">(current)</span></a>
                </li>
                <li class="nav-item" id="nav-game">
                <a class="nav-link" href="#">Game</a>
                </li>
                <li class="nav-item" id="nav-chat">
                    <a class="nav-link" href="#">Chat</a>
                </li>
                <li class="nav-item" id="nav-log-out">
                    <a class="nav-link text-danger" href="#">Log Out</a>
                </li>
            </ul>
            <form class="form-inline my-2 my-lg-0">
                <input class="form-control mr-sm-2" type="search" placeholder="Find Friends...">
                <button class="btn btn-outline-success my-2 my-sm-0" type="submit">Find</button>
            </form>
            </div>
        </nav>
        `

        this.profileLink = this.querySelector("#nav-profile");
        this.gameLink = this.querySelector("#nav-game");
        this.chatLink = this.querySelector("#nav-chat");
        this.quitLink = this.querySelector("#nav-log-out");
    }
}