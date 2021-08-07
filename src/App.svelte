<script>
	import ChooseCategory from './ChooseCategory.svelte';
	import { dbGameSessionRoundValue, dbGameSessionRounds, dbHost,dbUser} from './database';
	import Game from './Game.svelte';
	import YouAreOffline from './YouAreOffline.svelte';
	import TriviaIcon from './TriviaIcon.svelte';
	import { getParams } from './utils';
	import Welcome from './Welcome.svelte';
	import HalfTime from './HalfTime.svelte';

	let page;
	let dbGameSessionRound;
	let roundValue;
	let user;

	const snapFun = function(snap){
        if(!snap.exists()) {
            if(roundValue !== 1) {
				page = 'Welcome' // Only for now
            }
            else {
                page = 'Welcome'
            }
            return;
        }
        page = snap.val().page;
		if(!page && roundValue === 1) {
			page = 'Welcome';
		}
    }
	dbUser.on('value',(snap)=>{
		if(!snap.exists()) {
			return;
		}
		user = snap.val();
	})
	dbGameSessionRoundValue.on('value',(snap)=>{
        if(!snap.exists()) {
            return;
        }
        roundValue = snap.val();
        if(dbGameSessionRound){
            dbGameSessionRound.off('value',snapFun);
        }

        dbGameSessionRound = dbGameSessionRounds.child(roundValue);
        dbGameSessionRound.on('value',snapFun);
    })
	$: console.log('roundValue ',roundValue);
	$: console.log('page ',page);

	
	let userId = getParams('userId');
	let hostId;
	if((getParams('isHost') === 'true')) {
		console.log('Hey');
		dbHost.get().then((snap)=>{
			if(!snap.exists()) {
				return;
			}
			hostId = snap.val();
		})
	}
	$: {
		if(hostId === undefined) {
			if(getParams('isHost') === 'true') {
				dbHost.set(userId);
			}
		}
	}
</script>
<main>
	{#if page === 'Welcome'}
		<Welcome/>
	{:else if page === "Game"}
		<Game/>
	{:else if page === 'HalfTime'}
		<HalfTime/>
	{:else if !user?.isOnline}
		<YouAreOffline/>
	{/if}
</main>

<style>
	:global(*) {
		box-sizing: border-box;
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
	@media screen and (max-width : 800px) {
        
        :global(html) {
            font-size : 14px;
        }
    }
    @media screen and (max-width : 700px) {
        :global(html) {
            font-size : 12px;
        }
    }
	main {
		background-image: url(/images/background.svg);
		width : 100vw;
		height : 100vh;
		background-size: 100vw 100vh;
		background-color : #343E98;
		padding : 1rem;
	}
</style>