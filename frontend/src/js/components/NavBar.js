import { navigateTo, quit } from "../helpers.js";
import {getMe, searchUsers} from "../service/users.js";

export default class extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();

        switch (this.getAttribute("current-active")) {
            case "profile":
                this.profileLink.classList.add('active');
                break
            case "game":
                this.gameLink.classList.add('active');
                break
            case "chat":
                this.chatLink.classList.add('active');
                break
        }

        this.profileLink.addEventListener("click", (e)=>{
            e.preventDefault();
             getMe().then(me=>{
                 navigateTo(`/profiles/${me.display_name}`)
             })
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

        this.initSearchComponents();
    }

    render() {
        this.innerHTML = `
        <nav class="navbar navbar-expand-lg navbar-light bg-light">
            <a class="navbar-brand text-under" >Trancendance</a>

            <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
            </button>
        
            <div class="collapse navbar-collapse" id="navbarSupportedContent">
            <ul class="navbar-nav mr-auto">
                <li class="nav-item" id="nav-profile">
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
                <div id="search-results-list" class="list-group list-group-flush" style="z-index: 1; position: absolute; top: 110%;"></div>
                <input id="search-input" autocomplete='off' class="form-control mr-sm-3" type="search" placeholder="Find Friends...">
                <div class="my-2 my-sm-0 ml-5"></div>
            </form>
            </div>
        </nav>
        `

        this.profileLink = this.querySelector("#nav-profile");
        this.gameLink = this.querySelector("#nav-game");
        this.chatLink = this.querySelector("#nav-chat");
        this.quitLink = this.querySelector("#nav-log-out");

        this.searchResultsList = this.querySelector("#search-results-list")
        this.searchInput = this.querySelector("#search-input")
    }

    async initSearchComponents() {
        this.searchInput.addEventListener('input', e => {
            this.searchResultsList.innerHTML = ``;

            let result = "";
            searchUsers(this.searchInput.value).then(users => {
                for (let i = 0; i < users.length && i < 3; i++) {
                    result += `<tr-user-small avatar="${users[i].avatar}" display-name="${users[i].display_name}" is-online="${users[i].is_online}"></tr-user-small>`
                }
                this.searchResultsList.innerHTML = result;
            })
        })
    }
}