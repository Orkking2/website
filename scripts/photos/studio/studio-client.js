const token = document.body.dataset.token;
const statusEl = document.querySelector('.status');
const editor = document.querySelector('[data-editor]');
const picker = document.querySelector('[data-picker]');
let state = { photos: [], essays: [], skipped: [] };
let openId = null;
/** The photograph the editor's inputs were built for, so they are built once and then left alone. */
let editorFor = null;
let refreshEditor = () => {};

/**
 * Pick up a fresh token when this tab has outlived the run that served it.
 *
 * The token is minted per run and embedded in the page, so a tab left pointed at the
 * studio across a restart holds a stale one and every save starts failing. Reloading
 * fetches a page carrying the current token. The timestamp guard means a genuine
 * rejection surfaces as an error rather than a reload loop.
 */
function reloadForFreshToken() {
	try {
		const last = Number(sessionStorage.getItem('studio-token-reload') || 0);
		if (Date.now() - last < 10000) return false;
		sessionStorage.setItem('studio-token-reload', String(Date.now()));
	} catch {
		// A browser that refuses storage still gets one reload attempt per page.
	}
	location.reload();
	return true;
}

const api = async (path, options = {}) => {
	const response = await fetch(path, {
		...options,
		headers: { 'X-Studio-Token': token, 'Content-Type': 'application/json', ...options.headers }
	});
	const body = await response.json();
	if (response.status === 403 && reloadForFreshToken())
		throw new Error('This tab was left open across a restart. Reloading…');
	if (!response.ok) throw new Error(body.error || 'Request failed.');
	return body;
};

let statusTimer;
function status(message, sticky = false) {
	statusEl.textContent = message;
	clearTimeout(statusTimer);
	if (!sticky) statusTimer = setTimeout(() => (statusEl.textContent = ''), 2200);
}

const el = (tag, properties = {}, children = []) => {
	const node = Object.assign(document.createElement(tag), properties);
	for (const child of [].concat(children)) if (child) node.append(child);
	return node;
};

const photoById = (id) => state.photos.find((photo) => photo.id === id);

/**
 * Redraw without stealing what is being typed.
 *
 * Anything rebuilt wholesale loses the caret and the field it was in. Every control
 * that can hold focus carries a stable key, so the same control can be found again
 * afterwards and the selection put back exactly where it was.
 */
function preservingFocus(update) {
	const active = document.activeElement;
	const key = active?.dataset?.key;
	const start = active?.selectionStart;
	const end = active?.selectionEnd;
	update();
	if (!key) return;
	const restored = document.querySelector(`[data-key="${CSS.escape(key)}"]`);
	if (!restored || restored === document.activeElement) return;
	restored.focus();
	if (start != null && typeof restored.setSelectionRange === 'function') {
		try {
			restored.setSelectionRange(start, end);
		} catch {
			/* A control that has no selection to restore is already focused, which is enough. */
		}
	}
}

/** A name for a photograph inside an essay, seeded from its title. */
function slugify(value) {
	const slug = (value || '')
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^[^a-z]+/, '')
		.replace(/-+$/g, '');
	return slug || 'photograph';
}

function uniqueAlias(base, taken) {
	if (!taken.includes(base)) return base;
	for (let suffix = 2; ; suffix += 1)
		if (!taken.includes(`${base}-${suffix}`)) return `${base}-${suffix}`;
}

/* ------------------------------------------------------------------ rendering */

function photoCard(photo, onClick = (chosen) => openEditor(chosen.id)) {
	const note = photo.error
		? photo.error
		: photo.backfillError
			? photo.backfillError
			: photo.issues?.length
				? photo.issues[0].replace(/^\w+: /, '')
				: !photo.record.reviewed
					? 'Not reviewed yet'
					: photo.record.captured.local.replace('T', ' ');
	const warn =
		photo.error || photo.backfillError || photo.issues?.length || !photo.record?.reviewed;
	const card = el('button', { type: 'button', className: 'card' }, [
		el('img', { src: photo.previewUrl, alt: '', loading: 'lazy' }),
		el('span', { className: 'card__meta' }, [
			el('span', { className: 'card__title', textContent: photo.title || photo.source }),
			el('span', {
				className: `card__note${warn ? ' card__note--warn' : ''}`,
				textContent: note
			}),
			photo.essay ? el('span', { className: 'card__tag', textContent: photo.essay.title }) : null
		])
	]);
	if (photo.error) card.disabled = true;
	else card.addEventListener('click', () => onClick(photo));
	return card;
}

function renderGrids() {
	const groups = {
		unfinished: state.photos.filter((photo) => photo.error || !photo.ready),
		ready: state.photos.filter((photo) => !photo.error && photo.ready)
	};
	for (const [key, list] of Object.entries(groups)) {
		// Called through an arrow, not passed straight to map: map would supply the index as
		// the second argument and quietly displace the default click handler.
		document
			.querySelector(`[data-grid="${key}"]`)
			.replaceChildren(...list.map((photo) => photoCard(photo)));
		document.querySelector(`[data-count="${key}"]`).textContent = String(list.length);
		document.querySelector(`[data-empty="${key}"]`).hidden = list.length > 0;
	}
	document.querySelector('[data-count="essays"]').textContent = String(state.essays.length);
	document.querySelector('[data-empty="essays"]').hidden = state.essays.length > 0;
}

function render() {
	preservingFocus(() => {
		renderGrids();
		renderEssays();
	});
	if (openId) refreshEditor();
}

/* -------------------------------------------------------------------- editor */

function field(label, control, hintNode) {
	return el('div', { className: 'field' }, [
		el('label', { textContent: label, htmlFor: control.id }),
		control,
		hintNode ?? null
	]);
}

const hint = (text, warn = false) =>
	el('span', { className: warn ? 'hint hint--warn' : 'hint', textContent: text });

function checkbox(label, id, checked, onChange) {
	const input = el('input', { type: 'checkbox', id, checked });
	input.dataset.key = id;
	input.addEventListener('change', () => onChange(input.checked));
	return {
		input,
		node: el('div', { className: 'field field--inline' }, [
			input,
			el('label', { textContent: label, htmlFor: id })
		])
	};
}

/**
 * A field that saves what you stopped typing, and never edits it back.
 *
 * Saving must not disturb writing: the value is left exactly as typed, trailing
 * space and all, and the control is never replaced, so the caret stays where it
 * was. The idle delay is long enough to pause and think mid-sentence.
 */
const IDLE_SAVE_MS = 1200;

function textInput(id, value, onCommit, { multiline = false, placeholder = '' } = {}) {
	const input = el(multiline ? 'textarea' : 'input', { id, value: value ?? '', placeholder });
	if (!multiline) input.type = 'text';
	input.dataset.key = id;
	let timer;
	let saved = value ?? '';
	const commit = () => {
		clearTimeout(timer);
		if (input.value === saved) return;
		saved = input.value;
		onCommit(input.value);
	};
	input.addEventListener('input', () => {
		clearTimeout(timer);
		timer = setTimeout(commit, IDLE_SAVE_MS);
	});
	input.addEventListener('blur', commit);
	return input;
}

async function patchPhoto(id, patch) {
	try {
		status('Saving…', true);
		const updated = await api(`/api/photos/${encodeURIComponent(id)}`, {
			method: 'PATCH',
			body: JSON.stringify(patch)
		});
		const index = state.photos.findIndex((photo) => photo.id === id);
		if (index >= 0) state.photos[index] = { ...state.photos[index], ...updated };
		render();
		status('Saved');
	} catch (error) {
		status(error.message, true);
	}
}

/** Build the editor's controls once for this photograph, then only refresh what is not typed into. */
function buildEditor(photo) {
	editorFor = photo.id;
	const record = photo.record;
	const save = (patch) => patchPhoto(photo.id, patch);
	const [date, time] = record.captured.local.split('T');

	const altHint = hint('');
	const altInput = textInput('f-alt', record.alt, (value) => save({ alt: value }), {
		multiline: true,
		placeholder: 'A person leans against a painted wall, half in shadow.'
	});
	const captionHint = hint('');
	const captionInput = textInput('f-caption', record.caption, (value) => save({ caption: value }), {
		multiline: true,
		placeholder: 'Printed beneath the photograph, for every reader.'
	});
	const titleInput = textInput('f-title', record.title, (value) => save({ title: value }), {
		placeholder: 'Untitled'
	});

	const decorative = checkbox(
		'Decorative — carries no meaning of its own',
		'f-decorative',
		record.decorative,
		(value) => save({ decorative: value })
	);
	const gallery = checkbox('Show in the gallery', 'f-gallery', record.gallery.included, (value) =>
		save({ galleryIncluded: value })
	);
	const reviewed = checkbox(
		'Reviewed — finished, and may be published',
		'f-reviewed',
		record.reviewed,
		(value) => save({ reviewed: value })
	);
	reviewed.node.classList.add('field--review');

	const latitude = el('input', { type: 'text', id: 'f-lat', placeholder: 'latitude' });
	const longitude = el('input', { type: 'text', id: 'f-long', placeholder: 'longitude' });
	latitude.value = record.coordinates?.latitude ?? '';
	longitude.value = record.coordinates?.longitude ?? '';
	latitude.dataset.key = 'f-lat';
	longitude.dataset.key = 'f-long';
	const commitCoordinates = () => {
		const hasBoth = latitude.value.trim() && longitude.value.trim();
		save({
			coordinates: hasBoth ? { latitude: latitude.value, longitude: longitude.value } : null
		});
	};
	for (const input of [latitude, longitude]) input.addEventListener('blur', commitCoordinates);
	const coordinateHint = hint('');

	const dateInput = el('input', { type: 'text', id: 'f-date', value: date });
	const timeInput = el('input', { type: 'text', id: 'f-time', value: time });
	dateInput.dataset.key = 'f-date';
	timeInput.dataset.key = 'f-time';
	const commitCapture = () =>
		save({ capturedLocal: `${dateInput.value.trim()}T${timeInput.value.trim()}` });
	for (const input of [dateInput, timeInput]) input.addEventListener('blur', commitCapture);
	const offset = el('input', {
		type: 'text',
		id: 'f-offset',
		value: record.captured.offset ?? '',
		placeholder: '+02:00'
	});
	offset.dataset.key = 'f-offset';
	offset.addEventListener('blur', () => save({ capturedOffset: offset.value }));

	const essaySelect = el('select', { id: 'f-essay' });
	essaySelect.dataset.key = 'f-essay';
	essaySelect.addEventListener('change', () => setPhotoEssay(photo.id, essaySelect.value || null));
	const essayHint = hint('');

	document.querySelector('[data-fields]').replaceChildren(
		field(
			'Title',
			titleInput,
			hint('Burned into the top-left of every served copy. Untitled if you leave it.')
		),
		reviewed.node,
		field('Alternative text', altInput, altHint),
		decorative.node,
		field('Caption', captionInput, captionHint),
		field(
			'Place, in words',
			textInput('f-location', record.location, (value) => save({ location: value }), {
				placeholder: 'Amsterdam'
			})
		),
		el('div', { className: 'field' }, [
			el('label', { textContent: 'Captured', htmlFor: 'f-date' }),
			el('div', { className: 'pair' }, [dateInput, timeInput]),
			hint('YYYY-MM-DD and HH:MM:SS, as read from the file.')
		]),
		field('UTC offset', offset),
		el('div', { className: 'field' }, [
			el('label', { textContent: 'Coordinates', htmlFor: 'f-lat' }),
			// Latitude first, in the order the mark and any map writes them.
			el('div', { className: 'pair' }, [latitude, longitude]),
			coordinateHint
		]),
		gallery.node,
		field('Photo essay', essaySelect, essayHint)
	);

	// Only what is displayed is refreshed on save. Inputs keep whatever is in them.
	refreshEditor = () => {
		const current = photoById(editorFor);
		if (!current || current.error) return;
		const now = current.record;
		document.querySelector('[data-editor-title]').textContent = current.title || current.source;
		const image = document.querySelector('[data-editor-preview]');
		if (image.dataset.for !== current.previewUrl) {
			image.src = current.previewUrl;
			image.dataset.for = current.previewUrl;
		}
		document.querySelector('[data-editor-mark]').textContent = current.watermark;
		document.querySelector('[data-editor-source]').textContent =
			`${current.source} · ${current.id}` +
			(current.filled?.length
				? ` · recovered ${current.filled.join(' and ')} from the original`
				: '') +
			(current.absent?.length ? ` · the original has no ${current.absent.join(' or ')}` : '');

		const problem = document.querySelector('[data-editor-problem]');
		problem.textContent = current.backfillError ?? '';
		problem.hidden = !current.backfillError;

		// Checkboxes are safe to reconcile: they cannot hold a half-typed value.
		decorative.input.checked = now.decorative;
		gallery.input.checked = now.gallery.included;
		reviewed.input.checked = now.reviewed;

		altInput.disabled = now.decorative;
		altHint.className = 'hint';
		if (now.decorative)
			altHint.textContent = 'Not needed: a decorative image is hidden from screen readers.';
		else if (!now.alt?.trim()) {
			altHint.className = 'hint hint--warn';
			altHint.textContent =
				'Required. This replaces the photograph for anyone who cannot see it, so describe what is in the frame.';
		} else if (now.caption && now.alt.trim() === now.caption.trim()) {
			altHint.className = 'hint hint--warn';
			altHint.textContent =
				'Identical to the caption, so a screen reader reads it twice. Describe the image here; save the remark for the caption.';
		} else altHint.textContent = 'Replaces the photograph. What is in the frame, plainly.';

		captionHint.textContent = now.caption?.trim()
			? 'Shown under the photograph, to everyone.'
			: 'Optional. Shown under the photograph, to everyone — what a viewer could not work out by looking.';

		coordinateHint.className = 'hint';
		if (now.coordinates) {
			coordinateHint.textContent = `Printed onto every served copy as ${current.watermark.split(' ').slice(1, 3).join(' ')}. Empty both to leave them off.`;
		} else if (current.absent?.includes('coordinates')) {
			// Distinguish "we looked and the original has none" from "nothing has looked yet",
			// which are otherwise the same empty pair of fields.
			coordinateHint.textContent =
				'This original carries no GPS, so there is nothing to fill in — it was taken with location off. Type both if you know them.';
		} else coordinateHint.textContent = 'Nothing is printed. Fill both to include them.';

		const options = [el('option', { value: '', textContent: '— none —' })].concat(
			state.essays.map((essay) => el('option', { value: essay.route, textContent: essay.title }))
		);
		essaySelect.replaceChildren(...options);
		essaySelect.value = current.essay?.route ?? '';
		essayHint.textContent = current.essay
			? `Named "${current.essay.alias}" in that essay. Rename it in the Essays tab.`
			: 'Adding it here writes it into that essay, which is the only place the link is kept.';
	};
	refreshEditor();
}

function openEditor(id) {
	openId = id;
	const photo = photoById(id);
	if (!photo || photo.error) return;
	buildEditor(photo);
	if (!editor.open) editor.showModal();
	if (location.hash !== `#${id}`) history.replaceState(null, '', `#${id}`);
}

editor.addEventListener('close', () => {
	openId = null;
	editorFor = null;
	refreshEditor = () => {};
	history.replaceState(null, '', location.pathname);
});

/* -------------------------------------------------------------------- essays */

async function saveEssay(route, patch) {
	status('Saving…', true);
	const updated = await api(`/api/essays/${encodeURIComponent(route)}`, {
		method: 'PATCH',
		body: JSON.stringify(patch)
	});
	state.essays = state.essays.map((essay) => (essay.route === route ? updated : essay));
	// The photographs carry the essay they belong to, so both views agree after a change.
	const belongs = new Map();
	for (const essay of state.essays)
		for (const image of essay.images)
			belongs.set(image.id, { route: essay.route, title: essay.title, alias: image.alias });
	state.photos = state.photos.map((photo) =>
		photo.error ? photo : { ...photo, essay: belongs.get(photo.id) ?? null }
	);
	render();
	status('Saved');
}

const guard = (work) => work().catch((error) => status(error.message, true));

/** Move a photograph between essays, writing only the essay files. */
function setPhotoEssay(id, route) {
	return guard(async () => {
		const current = state.essays.find((essay) => essay.images.some((image) => image.id === id));
		if (current?.route === route) return;
		if (current)
			await saveEssay(current.route, {
				images: current.images.filter((image) => image.id !== id)
			});
		if (!route) return;
		const target = state.essays.find((essay) => essay.route === route);
		if (!target) return;
		const alias = uniqueAlias(
			slugify(photoById(id)?.record?.title),
			target.images.map((image) => image.alias)
		);
		await saveEssay(route, { images: [...target.images, { alias, id }] });
	});
}

function essayRow(essay, image, index) {
	const photo = photoById(image.id);
	const reorder = (to) => {
		if (to < 0 || to >= essay.images.length) return;
		const images = [...essay.images];
		const [moved] = images.splice(index, 1);
		images.splice(to, 0, moved);
		guard(() => saveEssay(essay.route, { images }));
	};
	const up = el('button', {
		type: 'button',
		textContent: '↑',
		title: 'Move earlier',
		disabled: index === 0
	});
	const down = el('button', {
		type: 'button',
		textContent: '↓',
		title: 'Move later',
		disabled: index === essay.images.length - 1
	});
	up.addEventListener('click', () => reorder(index - 1));
	down.addEventListener('click', () => reorder(index + 1));

	const setCover = el('button', { type: 'button', textContent: 'Make cover' });
	setCover.addEventListener('click', () =>
		guard(() => saveEssay(essay.route, { cover: image.alias }))
	);

	const remove = el('button', {
		type: 'button',
		textContent: '✕',
		title: 'Remove from this essay'
	});
	remove.addEventListener('click', () =>
		guard(() =>
			saveEssay(essay.route, {
				images: essay.images.filter((other) => other.alias !== image.alias)
			})
		)
	);

	// The name is what the essay's prose refers to, so it is edited here and written into the file.
	const alias = el('input', { type: 'text', value: image.alias, className: 'alias' });
	alias.dataset.key = `alias:${essay.route}:${image.id}`;
	const renameTo = () => {
		const value = alias.value.trim();
		if (!value || value === image.alias) {
			alias.value = image.alias;
			return;
		}
		guard(async () => {
			try {
				await saveEssay(essay.route, {
					images: essay.images.map((other) =>
						other.alias === image.alias ? { alias: value, id: other.id } : other
					),
					...(essay.cover === image.alias ? { cover: value } : {})
				});
			} catch (error) {
				alias.value = image.alias;
				throw error;
			}
		});
	};
	alias.addEventListener('blur', renameTo);
	alias.addEventListener('keydown', (event) => {
		if (event.key === 'Enter') {
			event.preventDefault();
			alias.blur();
		}
	});

	const open = el('button', { type: 'button', className: 'thumb' }, [
		photo
			? el('img', { src: photo.previewUrl, alt: '', loading: 'lazy' })
			: el('span', { textContent: '?' })
	]);
	if (photo) open.addEventListener('click', () => openEditor(photo.id));

	const row = el('li', { draggable: true }, [
		open,
		el('span', { className: 'name' }, [
			alias,
			el('small', {
				textContent: photo
					? `${photo.title}${photo.ready ? '' : ' · unfinished, will not publish'}`
					: 'Not in the library'
			})
		]),
		essay.cover === image.alias
			? el('span', { className: 'cover', textContent: 'cover' })
			: setCover,
		el('span', { className: 'controls' }, [up, down, remove])
	]);
	row.dataset.index = String(index);
	return row;
}

function renderEssays() {
	const container = document.querySelector('[data-essays]');
	container.replaceChildren(
		...state.essays.map((essay) => {
			const list = el('ol');
			list.append(...essay.images.map((image, index) => essayRow(essay, image, index)));
			let from = null;
			list.addEventListener('dragstart', (event) => {
				from = Number(event.target.dataset.index);
				event.target.classList.add('dragging');
			});
			list.addEventListener('dragend', (event) => event.target.classList.remove('dragging'));
			list.addEventListener('dragover', (event) => {
				event.preventDefault();
				const row = event.target.closest('li');
				for (const other of list.children) other.classList.toggle('over', other === row);
			});
			list.addEventListener('drop', (event) => {
				event.preventDefault();
				const row = event.target.closest('li');
				for (const other of list.children) other.classList.remove('over');
				if (!row || from === null) return;
				const to = Number(row.dataset.index);
				if (to === from) return;
				const images = [...essay.images];
				const [moved] = images.splice(from, 1);
				images.splice(to, 0, moved);
				guard(() => saveEssay(essay.route, { images }));
			});

			const importButton = el(
				'button',
				{ type: 'button', className: 'import' },
				'Import photographs'
			);
			importButton.addEventListener('click', () => openPicker(essay.route));

			return el('section', { className: 'essay' }, [
				el('header', { className: 'essay__head' }, [
					el('h2', { textContent: essay.title }),
					el('code', { textContent: essay.route }),
					importButton
				]),
				essay.images.length
					? list
					: el('p', { textContent: 'No photographs yet. Import the ones this essay is about.' })
			]);
		})
	);
}

/* -------------------------------------------------------------------- picker */

let pickerRoute = null;

function openPicker(route) {
	pickerRoute = route;
	const essay = state.essays.find((candidate) => candidate.route === route);
	if (!essay) return;
	document.querySelector('[data-picker-title]').textContent = `Import into ${essay.title}`;
	const taken = new Set(essay.images.map((image) => image.id));
	const available = state.photos.filter((photo) => !photo.error && !taken.has(photo.id));
	document.querySelector('[data-picker-note]').textContent = available.length
		? 'Choose a photograph to add. It keeps its place in the library; only this essay changes.'
		: 'Every photograph in the library is already in this essay.';
	document.querySelector('[data-picker-grid]').replaceChildren(
		...available.map((photo) =>
			photoCard(photo, (chosen) => {
				picker.close();
				guard(async () => {
					const target = state.essays.find((candidate) => candidate.route === pickerRoute);
					if (!target) return;
					const alias = uniqueAlias(
						slugify(chosen.record?.title),
						target.images.map((image) => image.alias)
					);
					await saveEssay(pickerRoute, { images: [...target.images, { alias, id: chosen.id }] });
				});
			})
		)
	);
	if (!picker.open) picker.showModal();
}

/* ---------------------------------------------------------------------- boot */

for (const button of document.querySelectorAll('[data-tab]')) {
	button.addEventListener('click', () => {
		for (const other of document.querySelectorAll('[data-tab]'))
			other.setAttribute('aria-current', String(other === button));
		for (const panel of document.querySelectorAll('[data-panel]'))
			panel.hidden = panel.dataset.panel !== button.dataset.tab;
	});
}

document.querySelector('[data-action="rescan"]').addEventListener('click', async (event) => {
	event.target.disabled = true;
	status('Scanning…', true);
	try {
		state = await api('/api/rescan', { method: 'POST' });
		editorFor = null;
		render();
		if (openId) openEditor(openId);
		status('Library rescanned');
	} catch (error) {
		status(error.message, true);
	} finally {
		event.target.disabled = false;
	}
});

state = await api('/api/state');
render();

// A photograph is addressable, so a particular one can be reopened directly.
const requested = location.hash.slice(1);
if (requested && state.photos.some((photo) => photo.id === requested)) openEditor(requested);
