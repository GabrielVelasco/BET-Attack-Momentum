// Drag and Drop functions
let draggedElement = null;

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
        // Swap innerHTML and div attributes

        const draggedLeagueAtt = draggedElement.getAttribute('league');
        const draggedMatchId = draggedElement.getAttribute('id');
        const targetLeagueAtt = event.target.getAttribute('league');
        const targetMatchId = event.target.getAttribute('id');

        const tmp = draggedElement.innerHTML;
        draggedElement.innerHTML = event.target.innerHTML;
        draggedElement.setAttribute('league', targetLeagueAtt);
        draggedElement.setAttribute('id', targetMatchId);

        event.target.innerHTML = tmp;
        event.target.setAttribute('league', draggedLeagueAtt);
        event.target.setAttribute('id', draggedMatchId);

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

export { addDragAndDropHandlers };