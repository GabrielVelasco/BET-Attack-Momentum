let draggedElement = null;
const boundCards = new WeakSet();

function getMatchCard(event) {
    return event.target.closest(".match-card");
}

function handleDragStart(event) {
    const card = getMatchCard(event);
    if (!card) return;

    draggedElement = card;
    card.classList.add("match-card--dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", card.dataset.id || card.id);
}

function handleDragOver(event) {
    const card = getMatchCard(event);
    if (!card || card === draggedElement) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    card.classList.add("match-card--drag-over");
}

function handleDragLeave(event) {
    const card = getMatchCard(event);
    if (card) card.classList.remove("match-card--drag-over");
}

function handleDrop(event) {
    const targetCard = getMatchCard(event);

    if (!draggedElement || !targetCard || targetCard === draggedElement) return;

    event.preventDefault();
    event.stopPropagation();

    const targetRect = targetCard.getBoundingClientRect();
    const shouldPlaceAfter = event.clientY > targetRect.top + targetRect.height / 2;

    targetCard.parentElement.insertBefore(
        draggedElement,
        shouldPlaceAfter ? targetCard.nextSibling : targetCard
    );
}

function handleDragEnd() {
    if (draggedElement) draggedElement.classList.remove("match-card--dragging");

    document.querySelectorAll(".match-card--drag-over").forEach((card) => {
        card.classList.remove("match-card--drag-over");
    });

    draggedElement = null;
}

function addDragAndDropHandlers(element) {
    if (boundCards.has(element)) return;

    element.addEventListener("dragstart", handleDragStart, false);
    element.addEventListener("dragover", handleDragOver, false);
    element.addEventListener("dragleave", handleDragLeave, false);
    element.addEventListener("drop", handleDrop, false);
    element.addEventListener("dragend", handleDragEnd, false);
    boundCards.add(element);
}

export { addDragAndDropHandlers };
