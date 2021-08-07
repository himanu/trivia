<script>
    import { fly } from "svelte/transition";
	export let roundValue;
	export let msg = "Round";
</script>
<div class = 'roundContainer'  transition:fly="{{ y: -100, duration: 1000 } }">
	<svg class = 'svg' width="15" height="18" viewBox="0 0 15 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.74648 4.34071e-05L14.7461 17.4932L-0.000272989 14.7464L2.74648 4.34071e-05Z" fill="#A84480"/>
	</svg>
	<div class = 'round'>
		{msg} {roundValue}
	</div>
</div>
<style>
    :global(html) {
        font-size : 20px;
    }
    @media screen and (max-width : 1000px) {
        :global(html) {
            font-size : 18px;
        }
    }
    @media screen and (max-width : 900px) {
        :global(html) {
            font-size : 16px;
        }
    }
	.roundContainer {
		position : absolute;
		top : 50%;
		left : 50%;
		transform : translate(-50%,-50%) rotate(9deg);
		background : #A84480;
		display : inline-block;
		box-shadow: 3px 4px 0px #F980C9;
		z-index : 10;
	}
	.svg {
		position : absolute;
		bottom : 95%;
		right : 10px;
		transform : rotate(-9deg);
	}
	.round {
		color : #fff;
		padding : 20px;
        font-family : 'Padauk';
        font-weight : 700;
        font-size : 3rem;
        text-align : center;
	}
</style>