<script>
	let { children } = $props();

    let gradientPosition = $state(0);

    $effect(() => {
        const interval = setInterval(() => {
            gradientPosition = (gradientPosition + 1) % 100;
        }, 100);
        return () => clearInterval(interval);
    });
</script>

<span class="gtext" style="--gradient-position: {gradientPosition}">
	{@render children()}
</span>


<style>
	.gtext {
		/** TEXT GRADIENT */
		color: transparent;
		background-clip: text;
		-webkit-background-clip: text;
		background-image: repeating-radial-gradient(
			circle at calc(var(--gradient-position) * 1%) 50%,
			#00c6ff 0%,
			#00c6ff 5%,
			#0072ff 15%,
			#0072ff 25%,
			#0041c2 35%,
			#0041c2 65%,
			#0072ff 75%,
			#0072ff 85%,
			#00c6ff 95%,
			#00c6ff 100%
		);
		background-size: 400% 400%;
		animation: wavyGradient 5s ease infinite;
	}

	@keyframes wavyGradient {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}
</style>
