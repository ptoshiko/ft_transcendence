import AbstractView from "./AbstractView.js";

export default class extends AbstractView {
    constructor() {
        super()
        this.setTitle("Profile")
    }

    async getHtml() {
        return `
            <h1>My Profile</h1>
        `
    }
}