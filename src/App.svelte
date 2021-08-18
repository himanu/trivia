<script>
	import { dbGameSessionRoundValue, dbGameSessionRounds, dbHost,dbUser,dbUsers,dbHostAction, listenFirebaseKey} from './database';
	import Game from './Game.svelte';
	import YouAreOffline from './YouAreOffline.svelte';
	import { getParams, notification } from './utils';
	import Welcome from './Welcome.svelte';
	import HalfTime from './HalfTime.svelte';
	import {info} from './Notifier';
	import Notification from './Notification.svelte';

	let page;
	let dbGameSessionRound;
	let roundValue;
	let user;
	let usersOnlineStatus = {};
	let users;
	let usersArray = [];
	let hostAction = {};

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
		if(!page) {
			page = 'Welcome';
		}
    }
	dbUser.on('value',(snap)=>{
		if(!snap.exists()) {
			return;
		}
		user = snap.val();
	})
	dbUsers.on('value',(snap)=>{
		if(!snap.exists()) {
			return;
		}
		users = snap.val();
	})
	
	listenFirebaseKey(dbHostAction,(dbHostActionRef)=>{
		dbHostActionRef.on('value',(snap)=>{
			if(!snap.exists()) {
				return;
			}
			hostAction = snap.val();
		})
	})

	$: {
		if( hostAction && hostId !== userId && ( (Date.now() - hostAction['time']) <= 5000) ) {
			let action = hostAction["action"];
			let notification;
			if(action === 'Category') {
				let previousCategory = hostAction["previousCategory"];
				let currentCategory = hostAction["currentCategory"];
				
				if(previousCategory && previousCategory !== currentCategory) {
					notification = `${hostName}(Host) has changed the category to ${currentCategory}`;
				}
				else if(!previousCategory && currentCategory){
					notification = `${hostName}(Host) has selected the ${currentCategory} category`;
				}
			}
			else if(action === "Start Game") {
				notification = `${hostName}(Host) has started the game`;
			}
			else if(action === "Continue Game") {
				notification = `${hostName}(Host) has continued the game`;
			}
			else if(action === 'Restart Game') {
				notification = `${hostName}(Host) has restarted the game`;
			}
			if(notification) {
				info(notification,'HostAction',5000);
			}
		}
	}
	$: {
		if(users) {
			usersArray = [];
			for(const id in users) {
				let currUser = users[id];
				usersArray.push(currUser);
				if(currUser.isOnline === false) {
					if( id in usersOnlineStatus && usersOnlineStatus[id] == true) {
						if(id === userId) {
							info('You have been disconnected, please check your internet connection!','Disconnected',5000);
						}
						else {
							info(`${users[id]['userName'].split(' ')[0]} is disconnected!`,'Disconnected',5000);
						}
					}
					usersOnlineStatus[id] = false;
				}
				else if(currUser.isOnline === true) {
					if(id in usersOnlineStatus && usersOnlineStatus[id] === false) {
						if(id === userId) {
                            info('You are reconnected!','Reconnected',5000);
                        }
                        else {
                            info(`${users[id]['userName'].split(' ')[0]} is reconnected!`,'Reconnected',5000);
                        }
					}
					usersOnlineStatus[id] = true;
				}
			}
		}
	}
	
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
			hostId = snap.val();
			if(!hostId) {
				dbHost.set(userId);
			}
		})
		.catch(()=>{
			dbHost.set(userId);
		})
	}

	let hostName;
	dbHost.on('value',(snap)=>{
        if(!snap.exists()) {
            return;
        }
        if(hostId) {
            const oldHostName = ( usersArray.find(user => user.id === hostId)?.userName.split(' ')[0] );
			const newHostName = ( usersArray.find(user => user.id === snap.val())?.userName.split(' ')[0] );
            let message = '';
            if (snap.val() === getParams('userId')) {
				message = `${oldHostName || "Old Host"} has left the game and you are the new host!`;
			} 
            else {
				if (newHostName) {
					message = `${oldHostName || "Old Host"} has left the game and new host is ${newHostName}!`;
				} else {
					message = `${oldHostName || "Old Host"} has left the game and new host has been assigned!`;
				}
			}
            info(message,"HostDisconnected",5000);
        }
        hostId = snap.val();
    })
	$: {
		if(users && hostId !== undefined) {
			hostName = users[hostId]['userName'].split(' ')[0];
		}
	}
</script>
<main>
	{#if !user?.isOnline}
		<YouAreOffline/>
	{:else if page === 'Welcome'}
		<Welcome/>
	{:else if page === "Game"}
		<Game/>
	{:else if page === 'HalfTime'}
		<HalfTime/>
	{/if}
	<Notification/>
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