<script>
    import {dbUsers,dbHost, dbGameSessionRound,listenFirebaseKey, dbCategoryName} from './database';
    import {getParams} from './utils';
    import Tick from './OnlineTick.svelte';
    import DisconnectedSvg from './DisconnectedSvg.svelte';
    import CustomButton from './CustomButton.svelte';
    import TriviaIcon from './TriviaIcon.svelte';

    let hostId;
    let isHost;
    let users;
    let usersArray = [];
    let userId = getParams('userId');
    let categoryName;
    let noOfOnlinePlayers = 0;
    let disableStartGameBtn = false;
    dbUsers.on('value',(snap)=>{
        if(!snap.exists()) {
            return;
        }
        users = snap.val();
    })
    
    listenFirebaseKey(dbCategoryName,(dbCategoryNameRef)=>{
        dbCategoryNameRef.on('value',(snap)=>{
            if(!snap.val()) {
                return;
            }
            categoryName = snap.val();
        })
    })
    $: {
        if(users) {
            console.log('users ',users);
            usersArray = [];
            noOfOnlinePlayers = 0;
            for(const id in users) {
                usersArray.push(users[id]);
                if(users[id].isOnline) {
                    noOfOnlinePlayers += 1;
                }
            }
        }
    }
    let hostName;
    dbHost.on('value',(snap)=>{
        if(!snap.exists()) {
            return;
        }
        hostId = snap.val();
        if(hostId === userId) {
            isHost = true;
        }
    })
    $: {
        if(hostId && users) {
            hostName = users[hostId]['userName'].split(' ')[0];
        }
    }
    function processName(currUser) {
        let name = currUser.userName;
        let fname = name?.split(" ")[0];
        if(fname?.length > 10)
        {
            fname = fname[0].toUpperCase();
            if(name?.split(" ")[1]) {
                fname += name?.split(" ")[1][0].toLowerCase();
            }
        }
        if(currUser.id === hostId) {
            if(currUser.id === userId) {
                fname = "You";
            }
            fname = fname + " (Host)";
        }
        else if(currUser.id === userId) {
            fname += " (You)";
        }
        return fname;
    }
    function validUserProfilePicture(str) {
        try {
            new URL(str);
            return true;
        }
        catch(err){
            return false;
        }
    }
    function handleChooseCategory() {
        listenFirebaseKey(dbGameSessionRound,(dbGameSessionRoundRef)=>{
            dbGameSessionRoundRef.update({
                page : "Choose Category"
            })
        })
    }
    function handleStartGame() {
        disableStartGameBtn = true;
        listenFirebaseKey(dbGameSessionRound,(dbGameSessionRoundRef)=>{
            dbGameSessionRoundRef.update({
                page : "Game",
                currentQuestionNumber : 0
            })
        })
    }
</script>
    <div class="welcomeContainer">
        <TriviaIcon/>
        <div class = "waitingMsg">
            {#if isHost}
                {#if !categoryName}
                    Select a category
                {:else}
                    You have selected <span class = "categoryName">" {categoryName} "</span> category
                {/if}
            {:else}
                {#if !categoryName && hostName}
                    Ask {hostName}(host) to select a category
                {:else if hostName} 
                    {hostName} (Host) have selected <span class = "categoryName">" {categoryName} "</span> category
                {/if}
            {/if}
        </div>
        <div class = "playersContainer">
            {#if hostId && users}
                <div class="host">
                    <div class = "imageContainer" title = {users[hostId].userName} style = "width : 6rem; height : 6rem ;border : 0.25rem solid {users[hostId].isOnline?"#40BB45":"#AC312F"}">
                        {#if users[hostId].isOnline}
                            <Tick/>
                        {:else}
                            <DisconnectedSvg/>
                        {/if}
                        {#if validUserProfilePicture(users[hostId].profilePicture)}
                            <img class = "profilePicture" src = "{users[hostId].profilePicture}"  alt = "profilePicture">
                        {:else}
                            <div class="fakeProfilePicture">
                                {users[hostId].userName[0].toUpperCase()}
                            </div>
                        {/if}
                    </div>
                    
                    <div class="name" style = "font-size : 0.85rem">
                        {processName(users[hostId])}
                    </div>
                </div>
            {/if}
            <div class = "normalPlayerContainer">
                {#each usersArray as currUser}
                    {#if currUser.id !== hostId}
                        <div class="normalPlayer">
                            <div class = "imageContainer" title = {currUser.userName} style = "border : 0.2rem solid {currUser.isOnline?"#40BB45":"#AC312F"}">
                                {#if currUser.isOnline}
                                    <Tick/>
                                {:else}
                                    <DisconnectedSvg/>
                                {/if}
                                {#if validUserProfilePicture(currUser.profilePicture)}
                                    <img class = "profilePicture"  src = "{currUser.profilePicture}" alt = "profilePicture">
                                {:else}
                                    <div class="fakeProfilePicture">
                                        {currUser.userName[0].toUpperCase()}
                                    </div>
                                {/if}
                            </div>
                            
                            <div class="name">
                                {processName(currUser)}
                            </div>
                        </div>
                    {/if}
                {/each}
            </div>
        </div>
        {#if isHost}
            {#if !categoryName}
                <CustomButton btnText = {"Choose Category"} on:click = {handleChooseCategory} disableBtn = {false}/>
            {:else}
                <div class="buttonContainer">
                    <CustomButton btnText = {"Change Category"} on:click = {handleChooseCategory} />
                    <CustomButton btnText = {"Start Game"} on:click = {handleStartGame} disableBtn = {noOfOnlinePlayers < 2 || disableStartGameBtn} tooltipMsg = {noOfOnlinePlayers<2?"Number of online players are less than 2":""}/>
                    
                </div>
            {/if}
        {/if}
    </div>
<style>
    ::-webkit-scrollbar {
        width: 14px;
    }
    /* Track */
    ::-webkit-scrollbar-track {
        background : initial;
        border-radius : 7px;
    }

    /* Handle */
    ::-webkit-scrollbar-thumb {
        background: #172072;;
        border-radius : 7px;
        border : 4px solid #343E98;
    }
    ::-webkit-scrollbar-thumb:hover {
        background: #0e1346;
    }
    .welcomeContainer {
        display : flex;
        flex-direction: column;
        align-items: center;
        height : 100%;
    }
    .categoryName {
        font-style: italic;
    }
    .playersContainer {
        margin : auto;
    }
    .host,.normalPlayer {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom : 1rem;
    }
    .imageContainer {
        position: relative;
        width : 5rem;
        height : 5rem;
        border-radius : 50%;
        display : flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 0.25rem;
    }
    .profilePicture {
        border-radius : 50%;
        width : 100%;
        color : #fff;
    }
    .fakeProfilePicture {
        display : flex;
        justify-content: center;
        align-items: center;
        width : 100%;
        border-radius : 50%;
        background : rgb(128,70,27);
        color : #fff;
        font-family : 'Manrope';
        font-size : 2rem;
        font-weight : 700;
    }
    .name {
        font-family : 'Manrope';
        font-size : 0.75rem;
        font-weight : 700;
        color : #fff;
    }
    .normalPlayerContainer {
        display : flex;
        justify-content: center;
        flex-wrap : wrap;
        max-height : 200px;
        max-width : 70vw;
        margin : 0 auto;
        overflow-y : auto;
        gap : 1rem;
    }
    .waitingMsg {
        font-family : 'Manrope';
        font-size : 1rem;
        font-weight : 700;
        color : #fff;
        margin-top : 2rem;
    }
    .buttonContainer {
        display : flex;
        gap : 1rem;
        justify-content: center;
        align-items: center;
    }
</style>