// Stable fragment links locate the photograph without JavaScript. This module
// enhances those same links into a viewer and keeps browser history meaningful.
const candidate = document.querySelector('[data-photo-viewer]');
// The gallery deals its photographs into columns, so the order they appear in the
// markup is not the order they are seen in. Previous and Next follow what is on the
// page: the sequence each frame records, or the markup where nothing says otherwise.
const links = /** @type {HTMLAnchorElement[]} */ (
	Array.from(document.querySelectorAll('a[data-view-photo]'))
)
	.map((link, position) => ({ link, order: Number(link.dataset.photoOrder ?? position) }))
	.sort((a, b) => a.order - b.order)
	.map((entry) => entry.link);
if (
	candidate instanceof HTMLDialogElement &&
	typeof candidate.showModal === 'function' &&
	links.length
) {
	const dialog = candidate;
	const stage = dialog.querySelector('[data-viewer-image]');
	const heading = dialog.querySelector('[data-viewer-title]');
	const caption = dialog.querySelector('[data-viewer-caption]');
	const position = dialog.querySelector('[data-viewer-position]');
	let index = -1;
	/** @type {Element | null} */
	let trigger = null;

	/** @param {number} next */
	function show(next) {
		const link = links[next];
		if (!(link instanceof HTMLAnchorElement) || !stage || !heading || !caption || !position) return;
		if (index !== next || !dialog.open) {
			index = next;
			const picture = link.querySelector('picture')?.cloneNode(true);
			if (picture instanceof HTMLElement) {
				picture
					.querySelectorAll('[sizes]')
					.forEach((element) => element.setAttribute('sizes', '100vw'));
				const image = picture.querySelector('img');
				if (image) {
					image.loading = 'eager';
					image.fetchPriority = 'high';
				}
				stage.replaceChildren(picture);
			}
			heading.textContent = link.dataset.title || 'Photograph';
			caption.textContent = link.dataset.caption || '';
			position.textContent = `${index + 1} / ${links.length}`;
		}
		if (!dialog.open) dialog.showModal();
		document.documentElement.classList.add('photo-viewer-open');
	}

	function syncFromUrl() {
		const selected = links.findIndex(
			(link) => link instanceof HTMLAnchorElement && `#${link.dataset.photoId}` === location.hash
		);
		if (selected < 0) {
			if (dialog.open) dialog.close();
			return;
		}
		trigger ??= links[selected];
		show(selected);
	}

	/** @param {number} selected */
	function open(selected) {
		const link = links[selected];
		if (!(link instanceof HTMLAnchorElement)) return;
		trigger = link;
		if (location.hash !== `#${link.dataset.photoId}`) {
			const url = new URL(location.href);
			url.hash = link.dataset.photoId || '';
			history.pushState({ ...history.state, nebvePhoto: true }, '', url);
		}
		syncFromUrl();
	}

	/** @param {number} next */
	function advance(next) {
		const link = links[(next + links.length) % links.length];
		if (!(link instanceof HTMLAnchorElement)) return;
		const url = new URL(location.href);
		url.hash = link.dataset.photoId || '';
		// Stepping through a viewer doesn't fill the Back button with photographs.
		history.replaceState(history.state, '', url);
		syncFromUrl();
	}

	function close() {
		if (history.state?.nebvePhoto) {
			history.back();
		} else {
			// A pasted link or fresh tab may have no gallery entry behind it.
			const url = new URL(location.href);
			url.hash = '';
			history.replaceState(history.state, '', url);
		}
		if (dialog.open) dialog.close();
	}

	links.forEach((link, linkIndex) => {
		const permalink = link.closest('figure')?.querySelector('[data-photo-permalink]');
		[link, permalink].forEach((target) =>
			target?.addEventListener('click', (event) => {
				if (
					!(event instanceof MouseEvent) ||
					event.button !== 0 ||
					event.metaKey ||
					event.ctrlKey ||
					event.shiftKey ||
					event.altKey
				)
					return;
				event.preventDefault();
				open(linkIndex);
			})
		);
	});
	dialog.querySelector('[data-viewer-close]')?.addEventListener('click', close);
	dialog
		.querySelector('[data-viewer-previous]')
		?.addEventListener('click', () => advance(index - 1));
	dialog.querySelector('[data-viewer-next]')?.addEventListener('click', () => advance(index + 1));
	dialog.addEventListener('cancel', (event) => {
		event.preventDefault();
		close();
	});
	dialog.addEventListener('keydown', (event) => {
		if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
			event.preventDefault();
			advance(index + (event.key === 'ArrowLeft' ? -1 : 1));
		}
	});
	dialog.addEventListener('close', () => {
		document.documentElement.classList.remove('photo-viewer-open');
		stage?.replaceChildren();
		if (trigger instanceof HTMLElement) trigger.focus({ preventScroll: true });
	});
	window.addEventListener('popstate', syncFromUrl);
	window.addEventListener('hashchange', syncFromUrl);
	syncFromUrl();
}
