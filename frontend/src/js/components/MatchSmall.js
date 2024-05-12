import {formatAvatar, navigateTo, redirectTo} from "../helpers.js";

export default class extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const gameID = this.getAttribute('game-id');
        const result = this.getAttribute("game-result");
        let avatar = this.getAttribute("avatar");

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
                        <div class="col-5">
                            <img class="rounded-circle" width="50" height="50" src="${formatAvatar(avatar)}">
                        </div>
                        <div class="col-2"></div>
                        <div class="col-5">
                            <h5 id="result-cmp" class="mb-0">You ${result}</h5>
                        </div>
                    </div>
                </div>
           </a> `;

        this.resultCmp = this.querySelector("#result-cmp")
    }
}