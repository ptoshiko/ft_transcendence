export default class extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        document.title = "Not Found";
    }

    render() {
       this.innerHTML = `
            <section class="not-found-container">
                <div class="not-found-content">
                    <h1> Не Нашла </h1>
                    <div class="not-found-img">
                        <img src="/images/404.jpeg" alt="not found">
                    </div>
                </div>
            </section>
        `;
    }
}