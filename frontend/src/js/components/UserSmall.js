export default class extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const avatar = this.getAttribute("avatar");
        const displayName = this.getAttribute("display-name");

        this.render(avatar, displayName);
    }

    render(avatar, displayName) {
        this.innerHTML = ` 
            <a href="#"class="list-group-item list-group-item-action">
                <div class="container">
                    <div class="row align-items-center">
                        <div class="col-2">
                            <img class="rounded-circle" width="50" height="50" src="${displayName}">
                        </div>
                        <div class="col-10">
                            <h5 class="card-sub-title">${avatar}</h5>
                        </div>
                    </div>
                </div>
            </a> `;
    }
}