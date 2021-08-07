<script>
	export let btnText;
	export let disableBtn;
	export let tooltipMsg;
</script>
<button class = "startBtn" class:scaleBtn = {!disableBtn} class:disabledBtn = {disableBtn} disabled = {disableBtn === true} on:click> 
	{#if tooltipMsg}
		<div class="tooltip">
			{tooltipMsg}
		</div>
	{/if}
    <div class = "text">{btnText} </div>
    <div class = "btnArrow">
        <svg width="23" height="15" viewBox="0 0 23 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.25391 5.94377L14.5352 4.94377V1.79534C14.5352 1.46721 14.6953 1.22112 15.0156 0.975025C15.3359 0.892994 15.6563 0.892993 15.8945 1.05706C19.1758 3.35393 22.2969 7.20159 22.375 7.36565C22.4531 7.5219 22.5273 7.75627 22.5313 7.92034C22.5313 7.92424 22.5352 7.93206 22.5352 7.93596C22.5352 8.10002 22.457 8.34612 22.375 8.42815C22.2969 8.59221 19.2539 12.4516 15.8945 14.7485C15.5742 14.9125 15.2539 14.9946 15.0156 14.8305C14.6953 14.6664 14.5352 14.4203 14.5352 14.0922V10.9438L1.25391 9.94377C0.855469 9.62346 0.535156 8.81877 0.535156 7.93596C0.535156 7.13909 0.773438 6.26409 1.25391 5.94377Z" fill="#343E98"/>
        </svg>	
    </div>
</button>

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
    .startBtn{
		background: #FFFFFF;
		box-shadow: 0px 8px #98C8E2;
		border-radius: 30px;
		padding : 5px 20px;
		display : flex;
		justify-content: center;
		align-items: center;
		cursor : pointer;
		margin-top : 0;
		position : relative;
	}
	.disabledBtn {
		background: #FFFFFF;
		box-shadow: 0px 8px #98C8E2;
		border-radius: 30px;
		padding : 5px 20px;
		display : flex;
		justify-content: center;
		align-items: center;
		cursor : not-allowed;
		opacity: 0.6;
		margin-top : 0;
		position : relative;
	}

	.scaleBtn:hover {
		box-shadow: 0px 4px #98C8E2;
		position: relative;
		top : 4px;
	}
	.startBtn:hover .tooltip {
		opacity: 1;
		visibility: visible;
	}
	.disabledBtn:hover {
		opacity: 1;
	}
	.tooltip {
		position : absolute;
		bottom : 130%;
		background : #fff;
		color : #333;
		font-family: 'Padauk';
		font-size : 0.65rem;
		padding : 0.1rem 0.5rem;
		border-radius : 10px;
		opacity : 0;
		transition : opacity 0.3s;
		visibility: hidden;
	}
	.tooltip::after {
		content: "";
		position: absolute;
		top: 100%;
		left: 50%;
		margin-left: -5px;
		border-width: 5px;
		border-style: solid;
		border-color: #fff transparent transparent transparent;
	}
	.text{
		color: #343E98;
		font-family: 'Manrope';
		font-weight : 800;
		font-size : 1rem;
	}
	.btnArrow{
		margin-left : 8px;
	}
</style>