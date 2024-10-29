import { addDragAndDropHandlers } from './dragAndDrop.js';

const mainCont = document.querySelector(".mainContainer");
const leagueSelector = document.querySelector("#leagueSelector");

let liveMatchesList = [];

function _equal(a, b){
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

document.addEventListener("click", (evt) => {
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

async function getMatchStats(matchID) {
    // get all stats from all groups

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

        const allStats = [];

        // statistics[0] ==> for ALL periods. statistics[1] ==> for 1ST period. statistics[2] ==> for 2ND period.
        response.data.statistics[0].groups.forEach(group => {
            const groupStats = group.statisticsItems;

            allStats.push(...groupStats);
        });

        return allStats;

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

function getLiveScoreboard(matchIdTarget) {
    const match = liveMatchesList.find(match => match.id === matchIdTarget);

    if (match) {
        const { homeTeam, awayTeam, homeScore, awayScore } = match;
        return `${homeTeam.shortName} [${homeScore.current}] - [${awayScore.current}] ${awayTeam.shortName}`;
    }

    return "ENDED";
}

async function updateScores() {
    try {
        await updateLiveMatchesList();

        document.querySelectorAll('h2').forEach(scoreH2 => {
            if(scoreH2.innerText.includes('ENDED')) return;

            const matchID = Number(scoreH2.id);
            const newScore = getLiveScoreboard(matchID);

            if(newScore === "ENDED") {
                scoreH2.innerText = `${scoreH2.innerText} [ENDED]`;
            }else if(newScore !== scoreH2.innerText) {
                scoreH2.innerText = newScore;
            }
        });

        console.log("Scoreboards updated. Next update in 10 seconds.");

    } catch (error) {
        console.error("Error when running updateScores(): ", error.message);

    } finally {
        setTimeout(updateScores, 10000);
    }
}

async function updateStats() {
    const statsDivs = document.querySelectorAll('.statsDiv');

    statsDivs.forEach(async (statsDiv) => {
        const matchID = statsDiv.id;

        try{
            const statsReturned = await getMatchStats(matchID);

            statsReturned.forEach(({ key, home, away }) => {
                const homeStatSpan = statsDiv.querySelector(`.homeTeamsStatsDiv #${key}`);
                const awayStatSpan = statsDiv.querySelector(`.awayTeamsStatsDiv #${key}`);
                if (homeStatSpan) homeStatSpan.innerText = home;
                if (awayStatSpan) awayStatSpan.innerText = away;
            });

        } catch (error) {
            console.error(`Error at updateStats(). When requesting ${matchID} stats. Error: ${error.message}`);
        }
    });

    console.log("Stats updated. Next update in 30 seconds.");
    setTimeout(updateStats, 30000);
}

function createMatchCard(match) {
    const gameCard = document.createElement('div');
    gameCard.classList.add("matchContainer");
    gameCard.setAttribute('draggable', 'true');
    gameCard.setAttribute('league', match.tournament.name);

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

    gameCard.appendChild(matchCardHeader);
    gameCard.appendChild(iframeElement);

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
        { key: 'totalClearance', name: 'Clearances', icon: '🛡️' }
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

    gameCard.appendChild(statsDiv);
    
    mainCont.appendChild(gameCard);
    
    addDragAndDropHandlers(gameCard);
}

function hasPressureGraph(match){
    return match.hasEventPlayerHeatMap || match.hasEventPlayerStatistics;
}

async function checkLiveMatches(){
    liveMatchesList.forEach(match => {
        if(hasPressureGraph(match)){
            if(!leagueSelector.innerHTML.includes(match.tournament.name)){
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

    closeBtn.onclick = function() {
        modal.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
}

async function main(){
    try{
        await updateLiveMatchesList();
        checkLiveMatches();
        updateScores();
        updateStats();
        
    }catch (e){
        console.error(e.message);
        alert(e.message);
    }
}

main();