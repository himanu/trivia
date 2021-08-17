<script>
	import { notification } from "./utils.js";
	import { onDestroy } from "svelte";
	import DisconnectedSvg from './icons/DisconnectedSvg.svelte';
	import ReconnectedSvg from './icons/ReconnectedSvg.svelte';
	import HostChanged from './icons/HostChanged.svelte';
	import HostAction from './icons/HostAction.svelte';

	export let themes = {
		danger: "#bb2124",
		success: "#22bb33",
		warning: "#f0ad4e",
		info: "#5E576A",
		default: "#aaaaaa",
	};
	export let timeout = 5000;
	let count = 0;
	let toasts = [];
	let unsubscribe;
	function animateOut(node, { delay = 0, duration = 1000 }) {
		function vhTOpx(value) {
			var w = window,
				d = document,
				e = d.documentElement,
				g = d.getElementsByTagName("body")[0],
				x = w.innerWidth || e.clientWidth || g.clientWidth,
				y = w.innerHeight || e.clientHeight || g.clientHeight;
			return (y * value) / 100;
		}
		return {
			delay,
			duration,
			css: t => `opacity: ${(t - 0.7) * 1}; transform-origin: top right;`,
		};
	}
	function createToast(msg, theme, to,typeOfNotification) {
		const background = themes[theme] || themes["default"];
		toasts = [
			{
				id: count,
				msg,
				background,
				timeout: to || timeout,
				width: "100%",
				typeOfNotification
			},
			...toasts,
		];
		count = count + 1;
	}
	unsubscribe = notification.subscribe(value => {
		if (!value) {
			return;
		}
		createToast(value.message, value.type, value.timeout,value.typeOfNotification);
		notification.set();
	});
	onDestroy(unsubscribe);
	function removeToast(id) {
		toasts = toasts.filter(t => t.id != id);
	}
</script>
<ul class="toasts">
	{#each toasts as toast (toast.id) }
		<li class="toast" style="background: {toast.background};" out:animateOut>
			<div class="content">
				{#if toast.typeOfNotification === 'Disconnected'}
					<DisconnectedSvg/>
				{:else if toast.typeOfNotification === 'Reconnected'}
					<ReconnectedSvg/>
				{:else if toast.typeOfNotification === 'HostDisconnected'}
					<HostChanged/>
				{:else if toast.typeOfNotification === 'HostAction'}
					<HostAction/>
				{/if}
				<div class="contentMsg">
					{toast.msg}
				</div>
			</div>
			<div
				class="progress"
				style="animation-duration: {toast.timeout}ms;"
				on:animationend={() => removeToast(toast.id)}
			/>
		</li>
	{/each}
</ul>
<style>
	:global(.toasts) {
		list-style: none;
		position: fixed;
		bottom: 0;
		right: 0;
		padding: 0;
		margin: 0;
		z-index: 9999;
	}
	.toasts > .toast {
		position: relative;
		margin: 1vh 1vw;
		min-width: 30vw;
		position: relative;
		animation: animate-in 600ms forwards;
		color: #fff;
		border-radius : 10px;
		max-width : 40vw;
	}
	.toasts > .toast > .content {
		padding: 1vw;
		display: flex;
		align-items: center;
		position : relative;
		width : inherit;
		height : inherit;
	}
	.contentMsg {
		font-weight: 700;
        font-family : 'Manrope';
        font-size : 0.75rem;
		margin-left : 0.5rem;
		letter-spacing: 0.15rem;
		line-height : 1.15rem;
	}
	.toasts > .toast > .progress {
		position: absolute;
		bottom: 0;
		background-color: rgb(0, 0, 0, 0.3);
		height: 6px;
		width: 100%;
		animation-name: shrink;
		animation-timing-function: linear;
		animation-fill-mode: forwards;
	}
	.toasts > .toast:before,
	.toasts > .toast:after {
		content: "";
		position: absolute;
		z-index: -1;
		top: 50%;
		bottom: 0;
		left: 1vw;
		right: 1vw;
		border-radius: 100px / 10px;
	}
	.toasts > .toast:after {
		right: 1vw;
		left: auto;
		transform: skew(8deg) rotate(3deg);
	}
	@keyframes animate-in {
		0%,
		60%,
		75%,
		90%,
		to {
			-webkit-animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
			animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
		}
		0% {
			opacity: 0;
			transform: translate3d(3000px, 0, 0);
		}
		60% {
			opacity: 1;
			transform: translate3d(-25px, 0, 0);
		}
		75% {
			transform: translate3d(10px, 0, 0);
		}
		90% {
			transform: translate3d(-5px, 0, 0);
		}
		to {
			transform: none;
		}
	}
	@keyframes shrink {
		0% {
			width: 98vw;
		}
		100% {
			width: 0;
		}
	}
	@media (min-width: 480px) {
		@keyframes animate-in {
			0%,
			60%,
			75%,
			90%,
			to {
				-webkit-animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
				animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
			}
			0% {
				opacity: 0;
				transform: translate3d(3000px, 0, 0);
			}
			60% {
				opacity: 1;
				transform: translate3d(-25px, 0, 0);
			}
			75% {
				transform: translate3d(10px, 0, 0);
			}
			90% {
				transform: translate3d(-5px, 0, 0);
			}
			to {
				transform: none;
			}
		}
		@keyframes shrink {
			0% {
				width: 40vw;
			}
			100% {
				width: 0;
			}
		}
	}
</style>