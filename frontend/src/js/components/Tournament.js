export default class extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.tournamentID = this.getAttribute("tournament_id")
        this.render();
        document.title = "Tournament";
    }

    render() {
        this.innerHTML = `
            <tr-nav></tr-nav>
            <table class="table table-borderless">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Player 1</th>
                  <th scope="col">Player 2</th>
                  <th scope="col">Score</th>
                </tr>
              </thead>
              <tbody id="tt-body">
                <tr>
                  <th scope="row">1</th>
                  <td>Mark</td>
                  <td>Otto</td>
                  <td>@mdo</td>
                </tr>
                <tr>
                  <th scope="row">2</th>
                  <td>Jacob</td>
                  <td>Thornton</td>
                  <td>@fat</td>
                </tr>
              </tbody>
            </table>
        `;

        this.ttBody = this.querySelector("#tt-body")
    }

    async updateTableData() {
        const ttGames = await getGamesByTournament(this.tournamentID)

        this.ttBody.innerHTML = ``;
        for (let i = 0; i < ttGames.length; i++) {
            this.ttBody.innerHTML = `
                 <tr>
                  <th scope="row">${i+1}</th>
                  <td>${ttGames[i]}</td>
                  <td>${}</td>
                  <td>${ttGames[i].player1_score} - ${ttGames[i].player2_score}</td>
                </tr>
        ` + this.ttBody.innerHTML;
        }
    }
}