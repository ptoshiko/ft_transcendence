export default class extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const avatar = this.getAttribute('avatar');
        const displayName = this.getAttribute('displayName')

        this.render(avatar, displayName);
    }

    render(avatar, displayName) {
        this.innerHTML = `
            <a id="chat-friend-link" href="#" class="list-group-item list-group-item-action">
                <div class="container">
                    <div class="row align-items-center">
                        <div class="col-5">
                            <img class="rounded-circle" width="50" height="50" src="${avatar}">
                        </div>
                        <div class="col-2"></div>
                        <div class="col-5">
                            <h5 class="card-sub-title">${displayName}</h5>
                        </div>
                    </div>
                </div>
            </a>
        `;
    }
}