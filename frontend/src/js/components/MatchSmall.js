import {formatAvatar, navigateTo, redirectTo} from "../helpers.js";

export default class extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const gameID = this.getAttribute('game-id');
        const result = this.getAttribute("game-result");
        let avatar = this.getAttribute("avatar");

        const date = new Date(this.getAttribute('date_created'));
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        this.createdAT = `${year}-${month}-${day}`;

        this.render(avatar, result);

        if (result === "Won!") {
         this.resultCmp.classList.add("text-success")
        } else {
            this.resultCmp.classList.add("text-danger")
        }

        this.addEventListener('click', e => {
            e.preventDefault();
            navigateTo(`/games/${gameID}`);
        })

    }

    render(avatar, result) {
        this.innerHTML = ` 
            <a id="redirect-to-user" href="" class="list-group-item list-group-item-action">
                <div class="container" style="min-width: 215px">
                    <div class="row align-items-center">
                        <div class="col-4">
                            <img class="rounded-circle" width="50" height="50" src="${formatAvatar(avatar)}">
                        </div>
                        <div class="col-4">
                            <h5 id="result-cmp" class="mb-0">You ${result}</h5>
                        </div>
                        <div class="col-4">
                            <h6 class="mb-0">${this.createdAT}</h6>
                        </div>
                    </div>
                </div>
           </a> `;

        this.resultCmp = this.querySelector("#result-cmp")
    }
}