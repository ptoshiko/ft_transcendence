export default class extends HTMLElement {
    constructor() {
        super();
    }

    static observedAttributes = ["is_active"];

    connectedCallback() {
        const avatar = this.getAttribute('avatar');
        const displayName = this.getAttribute('displayName');
        const isOnline = this.getAttribute("is-online");

        this.render(avatar, displayName);

        if (isOnline==="true") {
            this.chatFriendOnOffStatus.classList.remove("bg-secondary");
            this.chatFriendOnOffStatus.classList.add("bg-success");
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "is_active":
                this.handleIsActiveChanged(oldValue, newValue);
                break;
        }
    }

    render(avatar, displayName) {
        this.innerHTML = `
            <a id="chat-friend-link" href="" class="list-group-item list-group-item-action">
                <div class="container">
                    <div class="row align-items-center">
                        <div class="col-5">
                            <img class="rounded-circle" width="50" height="50" src="${avatar}">
                        </div>
                        <div class="col-5">
                            <h5 class="mb-0">${displayName}</h5>
                        </div>
                         <div class="col-2">
                            <div id="chat-friend-on-off-status" style="width: 10px; height: 10px;" class="rounded-circle bg-secondary"></div>
                        </div>
                    </div>
                </div>
            </a>
        `;

        this.link = this.querySelector("#chat-friend-link");
        this.chatFriendOnOffStatus = this.querySelector("#chat-friend-on-off-status");
    }

    handleIsActiveChanged(oldValue, newValue) {
        if (newValue === oldValue || !this.link) {
            return;
        }

        if (newValue === "true") {
            this.link.classList.add("active");
            return;
        }

        this.link.classList.remove("active");
    }

}