/*
    1. get live matches from sofascore
    2. for each live match, create a div that contains the graph pressure and the live result of the match
    3. update the live result of the match every 10 seconds
    4. add a button to remove the div of the match
*/

const mainCont = document.querySelector(".mainContainer");
let draggedElement = null;

let liveMatchesList = [];

function _equal(a, b){
    return a === b;
}

document.addEventListener("click", (evt) => {
    evt.preventDefault();
    const clickedElement = evt.target;

    if (clickedElement.classList.contains("matchContainer")) {
        clickedElement.classList.toggle("divSelected");
    } else if (clickedElement.classList.contains("btnDiv")) {
        clickedElement.parentElement.classList.toggle("divSelected");
    } else if (clickedElement.classList.contains("closeBtn")) {
        clickedElement.closest(".matchContainer").remove();
    } else if (clickedElement.classList.contains("dropdownBtn")) {
        clickedElement.classList.toggle("active");
        clickedElement.nextElementSibling.classList.toggle("show");
    }
});

async function updateLiveMatchesList() {
    // Fetch live matches from sofascore, update the array 'liveMatches'

    try {
        const response = await axios.get("https://www.sofascore.com/api/v1/sport/football/events/live");
        liveMatchesList = response.data.events;

        if (liveMatchesList.length === 0) {
            throw new Error("No live matches at the moment!");
        }

        console.log("Live matches array updated successfully!");
        
        return liveMatchesList;

    } catch (error) {
        console.error("Error fetching live matches:", error.message);
        alert(error.message);
    }
}

async function getMatchStats(matchID) {
    // returned array contains objects (stats objects)
    // each object contains: stat key (ballPossession, shots, corners, ...), home (home teams stat value), away (away teams stat value)
    // 
    // example of returned array structure: [ 
    //                                        {key: "ballPossession", home: "60%", away: "40%"}, 
    //                                        {key: "shots", home: "5", away: "3"}, ...
    //                                      ]

    try {
        const response = await axios.get(`https://www.sofascore.com/api/v1/event/${matchID}/statistics`);

        return response.data.statistics[0].groups[0].statisticsItems || [];

    } catch (error) {
        console.error(`Error fetching stats for match ID ${matchID}:`, error.message);
        
        return [];
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
        const { homeTeam, awayTeam, homeScore, awayScore } = match; // extract value of the respective keys from match object
        
        return `${homeTeam.shortName} [${homeScore.current}] - [${awayScore.current}] ${awayTeam.shortName}`;
    }

    return "ENDED"; // if match not in liveMatchesList, then it ended...
}

async function updateScores() {
    // Each 'h2.id' is a match ID, use it to get the live score of a match

    try {
        await updateLiveMatchesList();

        // iterates through all h2 elements, for each, get it's id, get the live score for that id and update the text of the h2 element
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

        console.log("Live results updated!");

    } catch (error) {
        console.error("Error updating scores:", error.message);

    } finally {
        setTimeout(updateScores, 10000); // call this function again after 10 seconds
    }
}

async function updateStats() {
    // Each 'statsDiv.id' is a match ID, use it to get the stats of a match (similar to 'updateScores' func)
    // Though to get the stats of a match, we need to make a separate request to the API

    const statsDivs = document.querySelectorAll('.statsDiv');

    statsDivs.forEach(async (statsDiv) => {
        const matchID = statsDiv.id;
        const statsReturned = await getMatchStats(matchID);

        statsReturned.forEach(({ key, home, away }) => {
            const homeStatSpan = statsDiv.querySelector(`.homeTeamsStatsDiv #${key}`);
            const awayStatSpan = statsDiv.querySelector(`.awayTeamsStatsDiv #${key}`);
            if (homeStatSpan) homeStatSpan.innerText = home;
            if (awayStatSpan) awayStatSpan.innerText = away;
        });
    });

    console.log("Stats updated!");

    setTimeout(updateStats, 30000); // call this function again after 10 seconds
}

// Drag and Drop functions
function handleDragStart(event) {
    draggedElement = event.target;
    event.target.style.opacity = "0.5";
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', event.target.innerHTML);
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(event) {
    if (event.target.classList.contains('matchContainer')) {
        event.target.classList.add('over');
    }
}

function handleDragLeave(event) {
    if (event.target.classList.contains('matchContainer')) {
        event.target.classList.remove('over');
    }
}

function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    if (draggedElement !== event.target && event.target.classList.contains('matchContainer')) {
        draggedElement.innerHTML = event.target.innerHTML;
        event.target.innerHTML = event.dataTransfer.getData('text/html');
        addDragAndDropHandlers(draggedElement); // Re-apply handlers to new elements
        addDragAndDropHandlers(event.target);
    }
    return false;
}

function handleDragEnd(event) {
    event.target.style.opacity = "1.0";
    document.querySelectorAll('.matchContainer').forEach(item => {
        item.classList.remove('over');
    });
}

function addDragAndDropHandlers(element) {
    element.addEventListener('dragstart', handleDragStart, false);
    element.addEventListener('dragenter', handleDragEnter, false);
    element.addEventListener('dragover', handleDragOver, false);
    element.addEventListener('dragleave', handleDragLeave, false);
    element.addEventListener('drop', handleDrop, false);
    element.addEventListener('dragend', handleDragEnd, false);
}
// Drag and Drop functions added

function createMatchCard(matchID) {
    const gameCard = document.createElement('div');
    gameCard.classList.add("matchContainer");
    gameCard.setAttribute('draggable', 'true');

    const iframeElement = createIframeElementFor(matchID);

    const divForBtnAndScoreboard = document.createElement('div');
    divForBtnAndScoreboard.classList.add('matchCardHeader');

    const btnRemoveCard = document.createElement('button');
    btnRemoveCard.classList.add('closeBtn');
    btnRemoveCard.innerText = "X";
    divForBtnAndScoreboard.appendChild(btnRemoveCard);

    const matchLiveResultH2 = document.createElement('h2');
    matchLiveResultH2.setAttribute("id", matchID);
    divForBtnAndScoreboard.appendChild(matchLiveResultH2);

    gameCard.appendChild(divForBtnAndScoreboard);
    gameCard.appendChild(iframeElement);

    // add stats for text for home team\
    const divHomeTeamStats = document.createElement('div');
    divHomeTeamStats.classList.add('homeTeamsStatsDiv');

    const ballPossHome = document.createElement('div');
    const ballPossHomeP = document.createElement('p'); ballPossHomeP.innerText = "Ball Possession"; ballPossHome.appendChild(ballPossHomeP);
    const ballPossHomeSpan = document.createElement('span'); ballPossHomeSpan.setAttribute('id', 'ballPossession'); ballPossHome.appendChild(ballPossHomeSpan);
    divHomeTeamStats.appendChild(ballPossHome);

    const xpGoalsHome = document.createElement('div');
    const xpGoalsHomeP = document.createElement('p'); xpGoalsHomeP.innerText = "xP Goals"; xpGoalsHome.appendChild(xpGoalsHomeP);
    const xpGoalsHomeSpan = document.createElement('span'); xpGoalsHomeSpan.setAttribute('id', 'expectedGoals'); xpGoalsHome.appendChild(xpGoalsHomeSpan);
    xpGoalsHomeSpan.innerText = "-";
    divHomeTeamStats.appendChild(xpGoalsHome);

    const bigChancesHome = document.createElement('div');
    const bigChancesHomeP = document.createElement('p'); bigChancesHomeP.innerText = "Big Chances"; bigChancesHome.appendChild(bigChancesHomeP);
    const bigChancesHomeSpan = document.createElement('span'); bigChancesHomeSpan.setAttribute('id', 'bigChanceCreated'); bigChancesHome.appendChild(bigChancesHomeSpan);
    bigChancesHomeSpan.innerText = "-";
    divHomeTeamStats.appendChild(bigChancesHome);

    const totalShotsHome = document.createElement('div');
    const totalShotsHomeP = document.createElement('p'); totalShotsHomeP.innerText = "Total Shots"; totalShotsHome.appendChild(totalShotsHomeP);
    const totalShotsHomeSpan = document.createElement('span'); totalShotsHomeSpan.setAttribute('id', 'totalShotsOnGoal'); totalShotsHome.appendChild(totalShotsHomeSpan);
    divHomeTeamStats.appendChild(totalShotsHome);

    const cornersHome = document.createElement('div');
    const cornersHomeP = document.createElement('p'); cornersHomeP.innerText = "Corners"; cornersHome.appendChild(cornersHomeP);
    const cornersHomeSpan = document.createElement('span'); cornersHomeSpan.setAttribute('id', 'cornerKicks'); cornersHome.appendChild(cornersHomeSpan);
    cornersHomeSpan.innerText = "-";
    divHomeTeamStats.appendChild(cornersHome);

    const passesHome = document.createElement('div');
    const passesHomeP = document.createElement('p'); passesHomeP.innerText = "Passes"; passesHome.appendChild(passesHomeP);
    const passesHomeSpan = document.createElement('span'); passesHomeSpan.setAttribute('id', 'passes'); passesHome.appendChild(passesHomeSpan);
    divHomeTeamStats.appendChild(passesHome);

    // add stats for text for away team
    const awayHomeTeamStats = document.createElement('div');
    awayHomeTeamStats.classList.add('awayTeamsStatsDiv');

    const ballPossAway = document.createElement('div');
    const ballPossAwayP = document.createElement('p'); ballPossAwayP.innerText = "Ball Possession"; 
    const ballPossAwaySpan = document.createElement('span'); ballPossAwaySpan.setAttribute('id', 'ballPossession'); ballPossAway.appendChild(ballPossAwaySpan); ballPossAway.appendChild(ballPossAwayP);
    awayHomeTeamStats.appendChild(ballPossAway);

    const xpGoalsAway = document.createElement('div');
    const xpGoalsAwayP = document.createElement('p'); xpGoalsAwayP.innerText = "xP Goals"; 
    const xpGoalsAwaySpan = document.createElement('span'); xpGoalsAwaySpan.setAttribute('id', 'expectedGoals'); xpGoalsAway.appendChild(xpGoalsAwaySpan); xpGoalsAway.appendChild(xpGoalsAwayP);
    xpGoalsAwaySpan.innerText = "-";
    awayHomeTeamStats.appendChild(xpGoalsAway);

    const bigChancesAway = document.createElement('div');
    const bigChancesAwayP = document.createElement('p'); bigChancesAwayP.innerText = "Big Chances"; 
    const bigChancesAwaySpan = document.createElement('span'); bigChancesAwaySpan.setAttribute('id', 'bigChanceCreated'); bigChancesAway.appendChild(bigChancesAwaySpan); bigChancesAway.appendChild(bigChancesAwayP);
    bigChancesAwaySpan.innerText = "-";
    awayHomeTeamStats.appendChild(bigChancesAway);

    const totalShotsAway = document.createElement('div');
    const totalShotsAwayP = document.createElement('p'); totalShotsAwayP.innerText = "Total Shots"; 
    const totalShotsAwaySpan = document.createElement('span'); totalShotsAwaySpan.setAttribute('id', 'totalShotsOnGoal'); totalShotsAway.appendChild(totalShotsAwaySpan); totalShotsAway.appendChild(totalShotsAwayP);
    awayHomeTeamStats.appendChild(totalShotsAway);

    const cornersAway = document.createElement('div');
    const cornersAwayP = document.createElement('p'); cornersAwayP.innerText = "Corners"; 
    const cornersAwaySpan = document.createElement('span'); cornersAwaySpan.setAttribute('id', 'cornerKicks'); cornersAway.appendChild(cornersAwaySpan); cornersAway.appendChild(cornersAwayP);
    cornersAwaySpan.innerText = "-";
    awayHomeTeamStats.appendChild(cornersAway);

    const passesAway = document.createElement('div');
    const passesAwayP = document.createElement('p'); passesAwayP.innerText = "Passes"; 
    const passesAwaySpan = document.createElement('span'); passesAwaySpan.setAttribute('id', 'passes'); passesAway.appendChild(passesAwaySpan); passesAway.appendChild(passesAwayP);
    awayHomeTeamStats.appendChild(passesAway);

    const statsDiv = document.createElement('div');
    statsDiv.classList.add('statsDiv');
    statsDiv.setAttribute('id', matchID);

    statsDiv.appendChild(divHomeTeamStats);
    statsDiv.appendChild(awayHomeTeamStats);

    gameCard.appendChild(statsDiv);

    mainCont.appendChild(gameCard);
    
    addDragAndDropHandlers(gameCard);
}

function hasPressureGraph(match){
    return match.hasEventPlayerHeatMap || match.hasEventPlayerStatistics;
}

async function createGameCards(){
    /*
        Create divs for each live match, each div contains the graph pressure and the live result of the match
    */

    for(let match of liveMatchesList){
        if(hasPressureGraph(match))
            createMatchCard(match.id);
    }
}

async function main(){
    try{
        // do request, build array of matches, for each match extract match id and build iframe..
        await updateLiveMatchesList();
        await createGameCards();
        updateScores();
        updateStats();
        
    }catch (e){
        console.log(e);
        alert('No live matches at the moment!');
    }
}

main();