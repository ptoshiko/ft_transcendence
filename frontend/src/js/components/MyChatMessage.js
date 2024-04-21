export default class extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const avatar = this.getAttribute('avatar');
        const displayName = this.getAttribute('displayName');
        const msg = this.getAttribute('msg')

        this.render(avatar, displayName, msg);
    }

    render(avatar, displayName, msg) {
        this.innerHTML = `
            <!-- My Message -->
            <div class="right d-flex ml-auto flex-row-reverse mt-1" style="max-width: 75%; column-gap: 10px;">
                <!-- Avatar -->
                <div class="">
                    <img class="rounded-circle" width="50" height="50" src="${avatar}">
                </div>
                <!-- Text -->
                <div class="bg-primary rounded p-2">
                    <h5 class="mb-1">${displayName}</h5>
                    <div class="msg-text text-light">${msg}</div>
                </div>
            </div>
        `;
    }
}