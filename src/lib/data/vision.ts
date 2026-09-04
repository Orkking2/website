/**
 * Public-facing language distilled from Nicolas's formal proposal.
 *
 * This is an implementation source, not a replacement for the proposal or
 * Nicolas's final editorial review. It deliberately excludes unsupported
 * biography, project results, contact details, and publication claims.
 */
export const principles = [
	{
		name: 'Interesting',
		summary:
			'Reveal structures and systems visually, use specific language, and introduce detail only when it helps understanding.',
		prompt: 'Does this make the next idea worth exploring?'
	},
	{
		name: 'Informative',
		summary:
			'Give every reader something useful, from a direct link or overview to the evidence behind a technical decision.',
		prompt: 'Can the reader leave knowing something concrete?'
	},
	{
		name: 'Approachable',
		summary:
			'Match vocabulary and depth to the moment so a first-time visitor and a specialist can enter the same work.',
		prompt: 'Is there a clear way in—and a clear next step?'
	}
] as const;

export const visitorPaths = [
	{
		audience: 'Here to understand the research',
		question: 'What is UBQ, and how does it work?',
		primaryLabel: 'Begin with UBQ',
		primaryHref: '/projects/ubq' as const,
		secondaryLabel: 'Browse Writing',
		secondaryHref: '/writing' as const
	},
	{
		audience: 'Here to evaluate the work',
		question: 'Who is Nicolas, and where is the evidence?',
		primaryLabel: 'About Nicolas',
		primaryHref: '/about' as const,
		secondaryLabel: 'Open the CV',
		secondaryHref: '/cv' as const
	},
	{
		audience: 'Here to look around',
		question: 'What else does Nicolas make and notice?',
		primaryLabel: 'See Photography',
		primaryHref: '/photography' as const,
		secondaryLabel: 'Browse Writing',
		secondaryHref: '/writing' as const
	}
] as const;

export const projectDepths = [
	{
		label: 'Orient',
		question: 'What problem is this work concerned with?',
		detail: 'A plain-language overview before implementation detail.'
	},
	{
		label: 'Use',
		question: 'What does the public interface make possible?',
		detail: 'Concrete behavior and vocabulary in the smallest useful frame.'
	},
	{
		label: 'Inspect',
		question: 'Which decisions, trade-offs, and failed paths shaped it?',
		detail: 'Visual explanations and technical writing for readers who want the internals.'
	},
	{
		label: 'Verify',
		question: 'Where are the primary materials?',
		detail: 'Direct links to the paper, source, documentation, and related articles.'
	}
] as const;

export const plannedWriting = [
	'Benchmarking an Unbounded MPMC Queue on Arm',
	'Memory Reclamation',
	'Contention and Block-Based Queues',
	'Head Packing'
] as const;
