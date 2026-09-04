<section
	class="identity-specimen identity-specimen--photography"
	aria-labelledby="photography-specimen-heading"
>
	<header class="identity-specimen__intro">
		<p class="index-label">Photography prototype / no photographs published</p>
		<div>
			<h2 id="photography-specimen-heading">Proportion, sequence, and context.</h2>
			<p>
				Outlined frames stand in for photographs during this layout review. They test mixed
				proportions, essay markers, viewer navigation, and the transition from a pinned image to
				advancing text without introducing substitute photography.
			</p>
		</div>
	</header>

	<div id="gallery-prototype" class="gallery-prototype" aria-label="Gallery layout prototype">
		<a
			class="gallery-prototype__item gallery-prototype__item--portrait"
			href="#photo-essay-prototype"
			aria-label="Open the photo essay transition prototype"
		>
			<span class="essay-marker">sequence.txt</span>
			<span class="prototype-frame" aria-hidden="true">portrait / 2:3</span>
			<span class="prototype-caption">01 / Essay-linked photograph</span>
		</a>

		<a
			class="gallery-prototype__item gallery-prototype__item--landscape"
			href="#gallery-viewer-prototype"
			aria-label="Open the full-screen viewer prototype"
		>
			<span class="prototype-frame" aria-hidden="true">landscape / 3:2</span>
			<span class="prototype-caption">02 / Standalone photograph</span>
		</a>

		<a
			class="gallery-prototype__item gallery-prototype__item--square"
			href="#gallery-viewer-prototype"
			aria-label="Open the full-screen viewer prototype"
		>
			<span class="prototype-frame" aria-hidden="true">square / 1:1</span>
			<span class="prototype-caption">03 / Standalone photograph</span>
		</a>

		<a
			class="gallery-prototype__item gallery-prototype__item--wide"
			href="#gallery-viewer-prototype"
			aria-label="Open the full-screen viewer prototype"
		>
			<span class="prototype-frame" aria-hidden="true">wide / 16:9</span>
			<span class="prototype-caption">04 / Standalone photograph</span>
		</a>
	</div>

	<section id="photo-essay-prototype" class="photo-essay-prototype" tabindex="-1">
		<header class="photo-essay-prototype__nav">
			<a href="#gallery-prototype">nebve.com / photography</a>
			<span>sequence.txt</span>
		</header>

		<div class="photo-essay-prototype__scroll">
			<div class="photo-essay-prototype__image">
				<div class="prototype-frame" aria-hidden="true">photograph withheld in prototype</div>
			</div>

			<article class="photo-essay-prototype__surface">
				<p class="entry-meta">Photo essay prototype</p>
				<h3>Context rises into view.</h3>
				<p>
					The image remains pinned below a minimal navigation bar while this black essay surface
					advances with the document scroll. The movement expresses the relationship between image
					and account; it does not replace either one.
				</p>
				<p>
					On a narrow or short viewport, image and text return to ordinary document order. Reduced
					motion keeps the same sequence without the covering transition.
				</p>
				<a class="index-link" href="#gallery-prototype">
					Return to gallery prototype <span aria-hidden="true">↑</span>
				</a>
			</article>
		</div>
	</section>

	<section id="gallery-viewer-prototype" class="gallery-viewer-prototype" tabindex="-1">
		<header>
			<span>02 / Viewer prototype</span>
			<a href="#gallery-prototype">Close</a>
		</header>
		<div class="prototype-frame" aria-hidden="true">selected photograph / 3:2</div>
		<p>No photograph is loaded in this identity fixture.</p>
	</section>
</section>
