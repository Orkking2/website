const token = document.querySelector('meta[name="photo-review-token"]').content;
const workspace = document.querySelector('.workspace');
const fatal = document.querySelector('#fatal');
const contactSheet = document.querySelector('#contact-sheet');
const position = document.querySelector('#position');
const incomplete = document.querySelector('#incomplete');
const saveState = document.querySelector('#save-state');
const sourceName = document.querySelector('#source-name');
const currentImage = document.querySelector('#current-image');
const metadataNote = document.querySelector('#metadata-note');
const form = document.querySelector('#photo-form');
const issuesList = document.querySelector('#issues-list');
const previousButton = document.querySelector('#previous');
const nextButton = document.querySelector('#next');
const decisionButtons = [...document.querySelectorAll('[data-status]')];

let state = null;
let currentIndex = 0;
const saveTimers = new Map();

async function api(path, options = {}) {
	const response = await fetch(path, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			'X-Photo-Review-Token': token,
			...(options.headers || {})
		}
	});
	const body = await response.json();
	if (!response.ok) throw new Error(body.error || 'The private review request failed.');
	return body;
}

function field(name) {
	return form.elements.namedItem(name);
}

function currentItem() {
	return state.items[currentIndex];
}

function incompleteCount() {
	return state.items.filter((item) => item.issues.length > 0).length;
}

function setForm(item) {
	for (const name of [
		'stableId',
		'title',
		'caption',
		'altText',
		'capturedAt',
		'capturedOffset',
		'publicLocation',
		'photoEssaySlug'
	]) {
		field(name).value = item.review[name] || '';
	}
	for (const name of ['captionReviewed', 'decorative', 'captureReviewed', 'galleryIncluded']) {
		field(name).checked = Boolean(item.review[name]);
	}
	field('altText').disabled = item.review.decorative;
}

function renderContactSheet() {
	contactSheet.replaceChildren(
		...state.items.map((item, index) => {
			const button = document.createElement('button');
			button.type = 'button';
			button.setAttribute('aria-label', 'Review ' + item.sourceFilename);
			button.setAttribute('aria-current', index === currentIndex ? 'true' : 'false');
			button.addEventListener('click', () => navigate(index));
			const image = document.createElement('img');
			image.src = item.thumbnailUrl;
			image.alt = '';
			image.loading = index < 8 ? 'eager' : 'lazy';
			const status = document.createElement('span');
			status.className = 'status-dot';
			status.dataset.status = item.review.status;
			status.title = item.review.status;
			button.append(image, status);
			return button;
		})
	);
}

function renderCurrent() {
	const item = currentItem();
	position.textContent = currentIndex + 1 + ' / ' + state.items.length;
	incomplete.textContent = incompleteCount() + ' incomplete';
	sourceName.textContent = item.sourceFilename;
	currentImage.src = item.thumbnailUrl;
	currentImage.alt = item.review.altText || '';
	previousButton.disabled = currentIndex === 0;
	nextButton.disabled = currentIndex === state.items.length - 1;
	for (const button of decisionButtons) {
		button.setAttribute(
			'aria-pressed',
			button.dataset.status === item.review.status ? 'true' : 'false'
		);
	}
	setForm(item);
	issuesList.replaceChildren(
		...item.issues.map((issue) => {
			const entry = document.createElement('li');
			entry.textContent = issue;
			return entry;
		})
	);
	if (item.issues.length === 0) {
		const entry = document.createElement('li');
		entry.textContent = 'Review complete for the current decision.';
		issuesList.append(entry);
	}

	const metadata = item.metadata || {};
	const capture = item.captureSuggestion || {};
	const notes = [
		(metadata.orientedWidth || '—') + ' × ' + (metadata.orientedHeight || '—'),
		metadata.profileName || 'unknown source profile',
		capture.raw
			? 'capture suggestion ' +
				capture.raw +
				(capture.offset ? ' ' + capture.offset : ' — timezone offset missing')
			: 'capture time missing'
	];
	if (item.warnings.length > 0) {
		notes.push(item.warnings.map((warning) => warning.message).join(' '));
	}
	metadataNote.replaceChildren(
		...notes.map((note) => {
			const paragraph = document.createElement('p');
			paragraph.textContent = note;
			return paragraph;
		})
	);
}

function render() {
	renderContactSheet();
	renderCurrent();
}

function navigate(index) {
	currentIndex = Math.max(0, Math.min(state.items.length - 1, index));
	render();
	document
		.querySelectorAll('#contact-sheet button')
		[currentIndex]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

function reviewPatch() {
	return {
		stableId: field('stableId').value,
		title: field('title').value,
		caption: field('caption').value,
		captionReviewed: field('captionReviewed').checked,
		altText: field('altText').value,
		decorative: field('decorative').checked,
		capturedAt: field('capturedAt').value,
		capturedOffset: field('capturedOffset').value,
		captureReviewed: field('captureReviewed').checked,
		publicLocation: field('publicLocation').value,
		galleryIncluded: field('galleryIncluded').checked,
		photoEssaySlug: field('photoEssaySlug').value
	};
}

async function save(importId, patch) {
	saveState.textContent = 'Saving…';
	try {
		const updated = await api('/api/items/' + encodeURIComponent(importId), {
			method: 'PATCH',
			body: JSON.stringify(patch)
		});
		const index = state.items.findIndex((item) => item.importId === importId);
		if (index !== -1) state.items[index] = updated;
		saveState.textContent = 'Saved';
		render();
	} catch (error) {
		saveState.textContent = 'Not saved: ' + error.message;
	}
}

function scheduleSave(delay = 350) {
	const item = currentItem();
	const patch = reviewPatch();
	clearTimeout(saveTimers.get(item.importId));
	saveTimers.set(
		item.importId,
		setTimeout(() => {
			saveTimers.delete(item.importId);
			save(item.importId, patch);
		}, delay)
	);
}

form.addEventListener('input', () => {
	field('altText').disabled = field('decorative').checked;
	scheduleSave();
});
form.addEventListener('change', () => scheduleSave(0));
form.addEventListener('submit', (event) => event.preventDefault());
previousButton.addEventListener('click', () => navigate(currentIndex - 1));
nextButton.addEventListener('click', () => navigate(currentIndex + 1));
for (const button of decisionButtons) {
	button.addEventListener('click', () => {
		const item = currentItem();
		save(item.importId, { status: button.dataset.status });
	});
}

document.addEventListener('keydown', (event) => {
	const target = event.target;
	const isField =
		target instanceof HTMLInputElement ||
		target instanceof HTMLTextAreaElement ||
		target instanceof HTMLSelectElement;
	if (isField) return;
	if (event.key === 'ArrowLeft') {
		event.preventDefault();
		navigate(currentIndex - 1);
	}
	if (event.key === 'ArrowRight') {
		event.preventDefault();
		navigate(currentIndex + 1);
	}
	if (['1', '2', '3'].includes(event.key)) {
		event.preventDefault();
		decisionButtons[Number(event.key) - 1].click();
	}
});

api('/api/state')
	.then((loaded) => {
		if (loaded.items.length === 0) throw new Error('This batch has no reviewable images.');
		state = loaded;
		workspace.hidden = false;
		saveState.textContent = 'Saved';
		render();
	})
	.catch((error) => {
		fatal.hidden = false;
		fatal.textContent = error.message;
	});
