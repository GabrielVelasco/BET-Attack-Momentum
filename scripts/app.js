import { addDragAndDropHandlers } from './dragAndDrop.js';

const mainCont = document.querySelector(".mainContainer");
const leagueSelector = document.querySelector("#leagueSelector");

let liveMatchesList = [];

function _equal(a, b) {
    return a === b;
}

leagueSelector.addEventListener("change", (evt) => {
    const selectedLeague = evt.target.value;
    const matchContainers = document.querySelectorAll('.matchContainer');

    matchContainers.forEach((matchContainer) => {
        const league = matchContainer.getAttribute('league');

        if (_equal(selectedLeague, "All") || _equal(selectedLeague, league)) {
            matchContainer.style.display = "block";
            matchContainer.querySelector('iframe').src = matchContainer.querySelector('iframe').src;
        } else {
            matchContainer.style.display = "none";
        }
    });
});

document.addEventListener("click", async (evt) => {
    const clickedElement = evt.target;

    if (clickedElement.classList.contains("matchContainer")) {
        clickedElement.classList.toggle("divSelected");

    } else if (clickedElement.classList.contains("btnDiv")) {
        clickedElement.parentElement.classList.toggle("divSelected");

    } else if (clickedElement.classList.contains("closeBtn")) {
        clickedElement.closest(".matchContainer").style.display = "none";

    } else if (clickedElement.classList.contains("dropdownBtn")) {
        clickedElement.classList.toggle("active");
        clickedElement.nextElementSibling.classList.toggle("show");

    } else if (clickedElement.classList.contains('periodBtn')) {
        // get match ID and selected period
        const matchCard = clickedElement.closest('.matchContainer');
        const matchID = matchCard.id; // get match id from parent div (periodSelector div with the tree btns)
        const selectedPeriodName = clickedElement.getAttribute('data-period'); // get period name form clicked btn
        const selectedPeriodIndex = selectedPeriodName === 'ALL' ? 0 : selectedPeriodName === '1ST' ? 1 : 2;

        try {
            // get stats for selected period
            const statsReturned = await getMatchStats(matchID, selectedPeriodIndex);
            // const statsDiv = document.querySelector(`.statsDiv[id="${matchID}"]`);

            if(statsReturned) {
                const statsDiv = matchCard.querySelector('.statsDiv');
                updateStatsTextForMatch(statsDiv, statsReturned);

                // update button styles (de-select all and select clicked)
                const periodButtonSiblings = clickedElement.parentElement.querySelectorAll('.periodBtn'); // get siblings of clicked button
                periodButtonSiblings.forEach(btn => btn.classList.remove('selected'));
                clickedElement.classList.add('selected');
            }

        } catch (error) {
            console.error(`Error when updating stats (when clicking in a different period):`, error);
        }
    }
});

async function updateLiveMatchesList() {
    try {
        const response = await axios.get("https://www.sofascore.com/api/v1/sport/football/events/live");
        liveMatchesList = response.data.events;

        if (liveMatchesList.length === 0) {
            throw new Error("At updateLiveMatchesList(). No live matches at the moment.");
        }

        console.log("Live matches array updated.");

        return liveMatchesList;

    } catch (error) {
        throw error;
    }
}

async function getMatchStats(matchID, period = 0) {
    // get stats for a given matchID and according to a selected period (ALL, 1ST, 2ND)

    try {
        const response = await axios.get(`https://www.sofascore.com/api/v1/event/${matchID}/statistics`);

        // exemple of JSON response:

        // {
        //     "statistics": [
        //         {
        //             "period": "ALL",
        //             "groups": [
        //                 {
        //                     "groupName": "Match overview",
        //                     "statisticsItems": [
        //                         { "name": "Ball possession", "home": "39%", "away": "61%" },
        //                         { "name": "Expected goals", "home": "2.00", "away": "0.59" },
        //                         { "name": "Big chances", "home": "4", "away": "0" },
        //                         { "name": "Total shots", "home": "20", "away": "8" },
        //                         { "name": "Goalkeeper saves", "home": "1", "away": "4" }
        //                         ...
        //                     ]
        //                 },
        //                 {
        //                     "groupName": "Shots",
        //                     "statisticsItems": [
        //                         { "name": "Total shots", "home": "20", "away": "8" },
        //                         { "name": "Shots on target", "home": "6", "away": "2" },
        //                         { "name": "Shots off target", "home": "9", "away": "5" }
        //                         ...
        //                     ]
        //                 },
        //                 {
        //                     "groupName": "Attack",
        //                     "statisticsItems": [
        //                         { "name": "Big chances scored", "home": "1", "away": "0" },
        //                         { "name": "Touches in penalty area", "home": "27", "away": "15" }
        //                         ...
        //                     ]
        //                 }
        //             ]
        //         },

        //         {
        //             "period": "1ST",
        //             "groups": [
        //                 {
        //                     "groupName": "Match overview",
        //                     "statisticsItems": [
        //                         { "name": "Ball possession", "home": "42%", "away": "58%" },
        //                         { "name": "Expected goals", "home": "0.76", "away": "0.15" }
        //                         ...
        //                     ]
        //                 },
        //                 {
        //                     "groupName": "Shots",
        //                     "statisticsItems": [
        //                         { "name": "Total shots", "home": "12", "away": "2" },
        //                         { "name": "Shots on target", "home": "4", "away": "1" }
        //                         ...
        //                     ]
        //                 }
        //             ]
        //         },

        //         {
        //             "period": "2ND",
        //             "groups": [
        //                 {
        //                     "groupName": "Match overview",
        //                     "statisticsItems": [
        //                         { "name": "Ball possession", "home": "37%", "away": "63%" },
        //                         { "name": "Expected goals", "home": "1.24", "away": "0.44" }
        //                         ...
        //                     ]
        //                 },
        //                 {
        //                     "groupName": "Shots",
        //                     "statisticsItems": [
        //                         { "name": "Total shots", "home": "8", "away": "6" },
        //                         { "name": "Shots on target", "home": "2", "away": "1" }
        //                         ...
        //                     ]
        //                 }
        //             ]
        //         }
        //     ]
        // }        

        // statistics[0] ==> for ALL periods || statistics[1] ==> for 1ST period || statistics[2] ==> for 2ND period.
        const periodStats = response.data.statistics[period] || null;
        if (periodStats){
            const allStats = [];

            periodStats.groups.forEach(group => {
                const groupStats = group.statisticsItems;

                allStats.push(...groupStats);
                // allStats = [{ key: 'statKey', home: '39%', away: '61%' }, { key: 'statKey', home: '2.00', away: '0.59' }, ...] 
                // array of stats objects from every group (Match overview, Shots ...) of a given selected period (ALL, 1ST, 2ND)
            });

            return allStats;

        }else {
            return null;
        }

    } catch (error) {
        throw error;
    }
}

function createIframeElementFor(matchID) {
    const iframeElement = document.createElement('iframe');
    iframeElement.src = `https://widgets.sofascore.com/embed/attackMomentum?id=${matchID}&widgetBackground=Gray&v=2`;
    iframeElement.scrolling = "no";

    return iframeElement;
}

async function updateScores() {
    try {
        await updateLiveMatchesList();

        liveMatchesList.forEach(match => {
            const matchID = match.id;
            const { homeTeam, awayTeam, homeScore, awayScore } = match;

            const matchh2 = document.querySelector(`h2[id="${matchID}"]`);
            if (matchh2) {
                const newScore = `${homeTeam.shortName} [${homeScore.current}] - [${awayScore.current}] ${awayTeam.shortName}`;
                matchh2.innerText = newScore;
            }
        });

        console.log("Scoreboards updated. Next update in 10 seconds.");

    } catch (error) {
        console.error("Error when running updateScores(): ", error.message);

    } finally {
        setTimeout(updateScores, 10000);
    }
}

function updateStatsTextForMatch(statsDiv, statsReturned) {
    // only change the stats values of a 'statsDiv' with a given 'statsList'

    statsReturned.forEach(stat => {
        const { key, home, away } = stat; // extract keys from statObj

        const homeStatSpan = statsDiv.querySelector(`.homeTeamsStatsDiv #${key}`);
        const awayStatSpan = statsDiv.querySelector(`.awayTeamsStatsDiv #${key}`);
        if (homeStatSpan) homeStatSpan.innerText = home;
        if (awayStatSpan) awayStatSpan.innerText = away;
    });
}

function updateStatsForAll() {
    // iterate through all statsDivs and update stats for each match

    const statsDivs = document.querySelectorAll('.statsDiv');

    statsDivs.forEach(async (statsDiv) => {
        const matchID = statsDiv.id;

        // get selected period (ALL, 1ST, 2ND) from the selected button (may put this in a function later...)
        const selectedPeriodDiv = statsDiv.parentElement.querySelector('.periodSelector');
        const selectedPeriodName = selectedPeriodDiv.querySelector('.selected').getAttribute('data-period');
        const selectedPeriodIndex = selectedPeriodName === 'ALL' ? 0 : selectedPeriodName === '1ST' ? 1 : 2;

        try {
            const statsReturned = await getMatchStats(matchID, selectedPeriodIndex);

            updateStatsTextForMatch(statsDiv, statsReturned);

        } catch (error) {
            console.error(`Error at updateStatsForAll(). When requesting ${matchID} stats. Error: ${error.message}`);
        }
    });

    console.log("Stats updated. Next update in 30 seconds.");
    setTimeout(updateStatsForAll, 30000);
}

function createPeriodSelector(matchID) {
    // create period selector div, add some buttons and return...

    const periodSelectorDiv = document.createElement('div');
    periodSelectorDiv.classList.add('periodSelector');
    periodSelectorDiv.setAttribute('id', matchID);

    const periods = ['ALL', '1ST', '2ND'];
    periods.forEach(period => {
        const button = document.createElement('button');

        button.classList.add('periodBtn');
        button.setAttribute('data-period', period);
        button.textContent = period;

        // set ALL as default selected
        if (period === 'ALL') {
            button.classList.add('selected');
        }

        periodSelectorDiv.appendChild(button);
    });

    return periodSelectorDiv;
}

function createMatchCard(match) {
    const matchCard = document.createElement('div');
    matchCard.classList.add("matchContainer");
    matchCard.setAttribute('draggable', 'true');
    matchCard.setAttribute('league', match.tournament.name);
    matchCard.setAttribute('id', match.id);

    const iframeElement = createIframeElementFor(match.id);

    const matchCardHeader = document.createElement('div');
    matchCardHeader.classList.add('matchCardHeader');

    const btnRemoveCard = document.createElement('button');
    btnRemoveCard.classList.add('closeBtn');
    btnRemoveCard.innerText = "X";
    matchCardHeader.appendChild(btnRemoveCard);

    const matchLiveResultH2 = document.createElement('h2');
    matchLiveResultH2.setAttribute("id", match.id);
    matchCardHeader.appendChild(matchLiveResultH2);

    matchCard.appendChild(matchCardHeader);
    matchCard.appendChild(iframeElement);

    // add selector with tree options [ALL, 1ST, 2ND]
    const periodSelectorDiv = createPeriodSelector(match.id);
    matchCard.appendChild(periodSelectorDiv);

    const statsDiv = document.createElement('div');
    statsDiv.classList.add('statsDiv');
    statsDiv.setAttribute('id', match.id);

    const statConfigs = [
        { key: 'ballPossession', name: 'Ball Possession', icon: '⚽' },
        { key: 'expectedGoals', name: 'xP Goals', icon: '🥅' },
        { key: 'bigChanceCreated', name: 'Big Chances', icon: '🎯' },
        { key: 'totalShotsOnGoal', name: 'Total Shots', icon: '👟' },
        { key: 'totalShotsInsideBox', name: 'Shots Inside Box', icon: '📍' },
        { key: 'totalShotsOutsideBox', name: 'Shots Outside Box', icon: '🎯' },
        { key: 'cornerKicks', name: 'Corners', icon: '🚩' },
        { key: 'passes', name: 'Passes', icon: '🔄' },
        { key: 'totalClearance', name: 'Clearances', icon: '🛡️' },
        { key: 'yellowCards', name: 'Yellow Cards', icon: '🟨' },
        { key: 'redCards', name: 'Red Cards', icon: '🟥' },
        { key: 'touchesInOppBox', name: 'Touches in Pen. Area', icon: '🏃' }
        // quiser adc mais stats, so adicionar mais objetos aqui...
    ];

    const divHomeTeamStats = document.createElement('div');
    divHomeTeamStats.classList.add('homeTeamsStatsDiv');

    const divAwayTeamStats = document.createElement('div');
    divAwayTeamStats.classList.add('awayTeamsStatsDiv');

    statConfigs.forEach(stat => {
        const homeStatDiv = document.createElement('div');
        const homeStatIcon = document.createElement('span');
        homeStatIcon.textContent = stat.icon;
        const homeStatName = document.createElement('p');
        homeStatName.textContent = stat.name;
        const homeStatValue = document.createElement('span');
        homeStatValue.id = stat.key;
        homeStatValue.textContent = '-';
        homeStatDiv.append(homeStatIcon, homeStatName, homeStatValue);
        divHomeTeamStats.appendChild(homeStatDiv);

        const awayStatDiv = document.createElement('div');
        const awayStatIcon = document.createElement('span');
        awayStatIcon.textContent = stat.icon;
        const awayStatName = document.createElement('p');
        awayStatName.textContent = stat.name;
        const awayStatValue = document.createElement('span');
        awayStatValue.id = stat.key;
        awayStatValue.textContent = '-';
        awayStatDiv.append(awayStatValue, awayStatName, awayStatIcon);
        divAwayTeamStats.appendChild(awayStatDiv);
    });

    statsDiv.appendChild(divHomeTeamStats);
    statsDiv.appendChild(divAwayTeamStats);

    matchCard.appendChild(statsDiv);

    mainCont.appendChild(matchCard);

    addDragAndDropHandlers(matchCard);
}

function hasPressureGraph(match) {
    return match.hasEventPlayerHeatMap || match.hasEventPlayerStatistics;
}

async function checkLiveMatches() {
    liveMatchesList.forEach(match => {
        if (hasPressureGraph(match)) {
            if (!leagueSelector.innerHTML.includes(match.tournament.name)) {
                leagueSelector.innerHTML += `<option value="${match.tournament.name}">${match.tournament.name}</option>`;
            }

            createMatchCard(match);
        }
    });
}

function showNewVersionModal() {
    const modal = document.getElementById('newVersionModal');
    const closeBtn = modal.querySelector('.close-modal');

    modal.style.display = 'block';

    closeBtn.onclick = function () {
        modal.style.display = 'none';
    }

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
}

async function main() {
    try {
        await updateLiveMatchesList();
        checkLiveMatches();
        updateScores();
        updateStatsForAll();

    } catch (e) {
        console.error(e.message);
        alert(e.message);
    }
}

main();