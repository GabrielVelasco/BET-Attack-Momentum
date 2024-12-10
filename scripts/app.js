import { addDragAndDropHandlers } from './dragAndDrop.js';

// DOM elements
const mainContainer = document.querySelector(".mainContainer");
const leagueSelector = document.querySelector("#leagueSelector");
leagueSelector.innerHTML = '<option value="All">All Leagues</option>';

// Interval constants (for future easy adjustments)
const SCORE_UPDATE_INTERVAL = 10000; // 10 seconds
const STATS_UPDATE_INTERVAL = 30000; // 30 seconds

// Global state
let liveMatchesList = [];

// Mapping for period indices
const PERIOD_MAP = {
    'ALL': 0,
    '1ST': 1,
    '2ND': 2,
};

// These are the stats we will display for each match
const STAT_CONFIGS_DISPLAY = [
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
];

/**
 * Fetch live matches list from SofaScore API
 */
async function refreshGlobalLiveMatchesList() {
    const response = await axios.get("https://www.sofascore.com/api/v1/sport/football/events/live");
    liveMatchesList = response.data.events || [];
}

/**
 * Fetch match statistics by match ID and period index
 * @param {Number} matchID 
 * @param {Number} periodIndex 
 * @returns {Array|null} Returns array of stats objects or null if none found
 */
async function fetchMatchStats(matchID, periodIndex = 0) {
    const response = await axios.get(`https://www.sofascore.com/api/v1/event/${matchID}/statistics`);
    const statsData = response.data.statistics || [];

    // Get stats for the specified period
    const periodStats = statsData[periodIndex] || null;
    if (!periodStats) return null;

    // Flatten groups of statistics into one array
    const allStats = periodStats.groups.reduce((acc, group) => {
        return acc.concat(group.statisticsItems);
    }, []);

    return allStats;
}

/**
 * Check if the match provides a pressure graph (attack momentum)
 * @param {Object} match 
 * @returns {Boolean}
 */
function matchHasPressureGraph(match) {
    // Adjust condition if needed based on actual API response
    return match.hasEventPlayerHeatMap || match.hasEventPlayerStatistics;
}

/**
 * Create an iframe element for a given match ID
 * @param {Number} matchID 
 * @returns {HTMLElement} iframe element
 */
function createIframeElementFor(matchID) {
    const iframe = document.createElement('iframe');
    iframe.src = `https://widgets.sofascore.com/embed/attackMomentum?id=${matchID}&widgetBackground=Gray&v=2`;
    iframe.scrolling = "no";

    return iframe;
}

/**
 * Create the period selector (ALL, 1ST, 2ND) for a match
 * @param {Number} matchID 
 * @returns {HTMLElement} period selector div
 */
function createPeriodSelector(matchID) {
    const periodSelector = document.createElement('div');
    periodSelector.classList.add('periodSelector');
    periodSelector.setAttribute('id', matchID);

    ['ALL', '1ST', '2ND'].forEach(period => {
        const button = document.createElement('button');
        button.classList.add('periodBtn');
        button.setAttribute('data-period', period);
        button.textContent = period;
        if (period === 'ALL') {
            button.classList.add('selected');
        }
        periodSelector.appendChild(button);
    });

    return periodSelector;
}

/**
 * Create the stats div that holds both home and away stats
 * @param {Number} matchID 
 * @returns {HTMLElement} statsDiv element
 */
function createStatsDiv(matchID) {
    const statsDiv = document.createElement('div');
    statsDiv.classList.add('statsDiv');
    statsDiv.setAttribute('id', matchID);

    const homeStatsDiv = document.createElement('div');
    homeStatsDiv.classList.add('homeTeamsStatsDiv');

    const awayStatsDiv = document.createElement('div');
    awayStatsDiv.classList.add('awayTeamsStatsDiv');

    STAT_CONFIGS_DISPLAY.forEach(stat => {
        const { key, name, icon } = stat;

        // Home stat line
        const homeStatLine = document.createElement('div');
        const homeIcon = document.createElement('span');
        homeIcon.textContent = icon;
        const homeName = document.createElement('p');
        homeName.textContent = name;
        const homeValue = document.createElement('span');
        homeValue.id = key;
        homeValue.textContent = '-';
        homeStatLine.append(homeIcon, homeName, homeValue);
        homeStatsDiv.appendChild(homeStatLine);

        // Away stat line
        const awayStatLine = document.createElement('div');
        const awayValue = document.createElement('span');
        awayValue.id = key;
        awayValue.textContent = '-';
        const awayName = document.createElement('p');
        awayName.textContent = name;
        const awayIcon = document.createElement('span');
        awayIcon.textContent = icon;
        awayStatLine.append(awayValue, awayName, awayIcon);
        awayStatsDiv.appendChild(awayStatLine);
    });

    statsDiv.appendChild(homeStatsDiv);
    statsDiv.appendChild(awayStatsDiv);

    return statsDiv;
}

/**
 * Create a match card
 * @param {Object} match - Match object from the liveMatchesList
 */
function createMatchCard(match) {
    const { id: matchID, tournament } = match;

    const matchCard = document.createElement('div');
    matchCard.classList.add("matchContainer");
    matchCard.setAttribute('draggable', 'true');
    matchCard.setAttribute('id', matchID);
    matchCard.setAttribute('league', tournament.name);

    // decides if card will be displayed or not based on league selector
    if (leagueSelector.value !== 'All' && leagueSelector.value !== tournament.name) {
        matchCard.style.display = 'none';
    }

    // Header
    const header = document.createElement('div');
    header.classList.add('matchCardHeader');

    const closeBtn = document.createElement('button');
    closeBtn.classList.add('closeBtn');
    closeBtn.innerText = "X";
    header.appendChild(closeBtn);

    const scoreH2 = document.createElement('h2');
    scoreH2.setAttribute("id", matchID);
    header.appendChild(scoreH2);

    // Iframe
    const iframeElement = createIframeElementFor(matchID);

    // Period selector
    const periodSelectorDiv = createPeriodSelector(matchID);

    // Stats Div
    const statsDiv = createStatsDiv(matchID);

    // Append elements to matchCard
    matchCard.append(header, iframeElement, periodSelectorDiv, statsDiv);
    mainContainer.appendChild(matchCard);

    // Add drag and drop handlers
    addDragAndDropHandlers(matchCard);
}

/**
 * Check if a match card is already rendered
 * @param {Number} matchID
 * @returns {Boolean}
 */
function cardAlreadyRendered(matchID) {
    return document.getElementById(matchID);
}

/**
 * Iterate through live matches and build a card for those with pressure graph and that are not already rendered.
 * Also populate the league selector with new leagues found.
 */
function buildMatchCards() {
    liveMatchesList.forEach(match => {
        if (matchHasPressureGraph(match) && !cardAlreadyRendered(match.id)) {
            const leagueName = match.tournament.name;

            // populate league selector with new leagues found
            if (!leagueSelector.querySelector(`option[value="${leagueName}"]`)) {
                const option = document.createElement('option');
                option.value = leagueName;
                option.textContent = leagueName;

                leagueSelector.appendChild(option);
            }

            createMatchCard(match);
        }
    });
}

/**
 * Update scoreboards for all live matches displayed
 */
async function updateScores() {
    try {
        liveMatchesList.forEach(match => {
            const { id: matchID, homeTeam, awayTeam, homeScore, awayScore } = match;
            const scoreElement = document.querySelector(`h2[id="${matchID}"]`);

            if (scoreElement) {
                const newScore = `${homeTeam.shortName} [${homeScore.current}] - [${awayScore.current}] ${awayTeam.shortName}`;
                scoreElement.innerText = newScore;
            }
        });

    } catch (error) {
        console.error("Error updating scores:", error.message);
        
    }
}

/**
 * Update stats content for a single match (replace the text content of the spans)
 * @param {HTMLElement} statsDiv - The stats div element, containing home and away stats divs
 * @param {Array} statsArray - Array of stats objects returned from the API
 */
function updateStatsTextForMatch(statsDiv, statsArray) {
    if (!statsArray) return;

    statsArray.forEach(stat => {
        const { key, home, away } = stat;

        // Check if specific stat is set to be displayed
        const config = STAT_CONFIGS_DISPLAY.find(c => c.key === key);
        if (!config) return; // Skip this stat (not supposed to be displayed)

        const homeStatSpan = statsDiv.querySelector(`.homeTeamsStatsDiv #${key}`);
        const awayStatSpan = statsDiv.querySelector(`.awayTeamsStatsDiv #${key}`);

        if (homeStatSpan) homeStatSpan.innerText = home;
        if (awayStatSpan) awayStatSpan.innerText = away;
    });
}

/**
 * Update stats for all displayed matches
 */
async function updateStatsForAll() {
    const statsDivs = document.querySelectorAll('.statsDiv');

    for (const statsDiv of statsDivs) {
        const matchID = statsDiv.id;

        const periodSelector = statsDiv.parentElement.querySelector('.periodSelector');
        const selectedButton = periodSelector.querySelector('.selected');
        const selectedPeriodName = selectedButton.getAttribute('data-period');
        const periodIndex = PERIOD_MAP[selectedPeriodName];

        try {
            const statsData = await fetchMatchStats(matchID, periodIndex);

            if (statsData) {
                updateStatsTextForMatch(statsDiv, statsData);
            }

        } catch (error) {
            console.error(`Error updating stats for match ${matchID}: ${error.message}`);
        }
    }

    console.log("Stats updated. Next update in 30 seconds.");

    setTimeout(updateStatsForAll, STATS_UPDATE_INTERVAL);
}

/**
 * Iterate through 'matchCard' list, deciding to hide or show match cards based on selected league
 */
function filterMatchesByLeague(selectedLeague) {
    const matchCards = document.querySelectorAll('.matchContainer');

    matchCards.forEach(card => {
        const matchLeague = card.getAttribute('league');

        if (selectedLeague === 'All' || selectedLeague === matchLeague) { // show card
            if(card.style.display === 'none'){
                // card is hidden, show it and reload iframe
                card.style.display = 'block';
                card.querySelector('iframe').src = card.querySelector('iframe').src;
            }

        } else { // hide card
            card.style.display = 'none';
        }
    });
}

/**
 * Event Listeners
 */

// Handle league selection change
leagueSelector.addEventListener("change", (event) => {
    const selectedLeague = event.target.value;
    filterMatchesByLeague(selectedLeague);
});

// Handle click events for various functionalities
document.addEventListener("click", async (event) => {
    const target = event.target;

    if (target.classList.contains("matchContainer")) {
        // Toggle selection of match container
        target.classList.toggle("divSelected");

    } else if (target.classList.contains("btnDiv")) {
        target.parentElement.classList.toggle("divSelected");

    } else if (target.classList.contains("closeBtn")) {
        // Close this match card
        target.closest(".matchContainer").style.display = "none";

    } else if (target.classList.contains("dropdownBtn")) {
        target.classList.toggle("active");
        target.nextElementSibling.classList.toggle("show");

    } else if (target.classList.contains('periodBtn')) {
        // Period button clicked, fetch and update stats for that match and period
        const matchCard = target.closest('.matchContainer');
        const matchID = matchCard.id;
        const selectedPeriodName = target.getAttribute('data-period');
        const periodIndex = PERIOD_MAP[selectedPeriodName];

        try {
            const statsData = await fetchMatchStats(matchID, periodIndex);
            if (statsData) {
                const statsDiv = matchCard.querySelector('.statsDiv');
                updateStatsTextForMatch(statsDiv, statsData);

                // Update button styling
                const siblingButtons = target.parentElement.querySelectorAll('.periodBtn');
                siblingButtons.forEach(btn => btn.classList.remove('selected'));
                target.classList.add('selected');
            }
        } catch (error) {
            console.error(`Error when updating stats for match ${matchID}:`, error);
        }
    }
});

/**
 * Main initialization function
 */
async function main() {
    try {
        await refreshGlobalLiveMatchesList();
        buildMatchCards();
        updateScores();
        updateStatsForAll();

        setInterval(async () => {
            await refreshGlobalLiveMatchesList();
            buildMatchCards();
            updateScores();

        }, SCORE_UPDATE_INTERVAL);      

    } catch (e) {
        console.error(e.message);
        alert(e.message);
    }
}

// Run the main function once the DOM is fully loaded
document.addEventListener("DOMContentLoaded", main);
