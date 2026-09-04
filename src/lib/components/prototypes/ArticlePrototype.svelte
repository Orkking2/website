<section
	class="identity-specimen identity-specimen--article"
	aria-labelledby="article-specimen-heading"
>
	<header class="identity-specimen__intro">
		<p class="index-label">Article prototype / not published</p>
		<div>
			<h2 id="article-specimen-heading">Annotations in the reading flow.</h2>
			<p>
				This non-public fixture tests the relationship between the main explanation, supporting
				notes, and canonical footnotes before the Markdown authoring system is introduced.
			</p>
		</div>
	</header>

	<div class="article-prototype">
		<input
			id="article-prototype-annotations"
			class="article-prototype__toggle"
			type="checkbox"
			checked
		/>
		<label for="article-prototype-annotations">Show annotations</label>

		<div class="article-prototype__grid">
			<section class="article-prototype__section" aria-labelledby="prototype-mechanism-heading">
				<p class="entry-meta">01 / Orient</p>
				<h3 id="prototype-mechanism-heading">Mechanism before conclusion.</h3>
				<p>
					A technical explanation should establish the state being examined before presenting its
					result. This specimen uses neutral editorial text; it makes no claim about UBQ or another
					project.<sup><a id="prototype-ref-1" href="#prototype-note-1">1</a></sup>
				</p>
			</section>

			<details class="annotation-note" open>
				<summary>Annotation 01</summary>
				<p>
					A side note can preserve provenance, a limitation, or an instructive detour without
					interrupting the main sentence.
				</p>
			</details>

			<section class="article-prototype__section" aria-labelledby="prototype-evidence-heading">
				<p class="entry-meta">02 / Inspect</p>
				<h3 id="prototype-evidence-heading">Keep evidence adjacent to the claim.</h3>
				<p>
					The reading column remains narrow enough for sustained prose. The annotation sits beside
					the relevant section on a wide screen and returns to the document flow when space becomes
					limited.
				</p>
			</section>

			<details class="annotation-note" open>
				<summary>Annotation 02</summary>
				<p>
					Approximate alignment is sufficient. The note should remain legible even when exact
					line-level alignment would make the layout brittle.
				</p>
			</details>

			<section class="article-prototype__section" aria-labelledby="prototype-consequence-heading">
				<p class="entry-meta">03 / Consequence</p>
				<h3 id="prototype-consequence-heading">Return to what the detail changes.</h3>
				<p>
					A mechanism becomes useful when its consequence is explicit. Longer evidence belongs in
					the article or a primary source, while the rail holds context that is valuable but not
					required for the argument.
				</p>
			</section>

			<details class="annotation-note" open>
				<summary>Annotation 03</summary>
				<p>
					On a narrow screen, this note becomes an ordinary disclosure immediately after its related
					section.
				</p>
			</details>

			<footer class="prototype-footnotes">
				<h3>Notes</h3>
				<ol>
					<li id="prototype-note-1">
						The final authoring system will generate note numbers from first-reference order.
						<a href="#prototype-ref-1" aria-label="Return to reference 1">↩</a>
					</li>
				</ol>
			</footer>
		</div>
	</div>
</section>
