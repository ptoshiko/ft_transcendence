import {navigateTo} from "../helpers.js";

export default class extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.ttID = this.getAttribute('id');
        this.ttStatus = this.getAttribute('status');

        const date = new Date(this.getAttribute('created-at'));
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        this.createdAT = `${year}-${month}-${day}`;

        this.render();
        this.handleStatus()

        this.addEventListener('click', this.getClickEvent())
    }

    render() {
        this.innerHTML = ` 
            <a id="redirect-to-user" href="" class="list-group-item list-group-item-action">
                <div class="container" style="min-width: 215px">
                    <div class="row align-items-center">
                        <div class="col-5">
                            <h5 id="tt-status" class="rounded-pill border-radius-2 text-center text-white"></h5>
                        </div>
                        <div class="col-2"></div>
                        <div class="col-5">
                            <h5 class="mb-0">${this.createdAT}</h5>
                        </div>
                    </div>
                </div>
            </a> `
        ;

        this.ttStatusCmp = this.querySelector("#tt-status");
    }

    handleStatus() {
        switch (this.ttStatus) {
            case "0":
                this.ttStatusCmp.innerHTML = "CREATED";
                this.ttStatusCmp.classList.add("bg-warning");
                break;
            case "1":
                this.ttStatusCmp.innerHTML = "IN PROGRESS";
                this.ttStatusCmp.classList.add("bg-success");
                break;
            case "2":
                this.ttStatusCmp.innerHTML = "FINISHED";
                this.ttStatusCmp.classList.add("bg-dark");
                break;
            case "3":
                this.ttStatusCmp.innerHTML = "CANCELED";
                this.ttStatusCmp.classList.add("bg-danger");
                break;
        }
    }

    getClickEvent() {
        return (e) => {
            e.preventDefault();
            navigateTo(`/tournaments/${this.ttID}`)
        }
    }
}