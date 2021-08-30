<script>
    import {dbUsers,dbHost,listenFirebaseKey,dbPage,dbCategoryName, dbHostAction,dbGameSessionRound} from './database';
    import {getParams} from './utils';
    import Tick from './OnlineTick.svelte';
    import DisconnectedSvg from './DisconnectedSvg.svelte';
    import CustomButton from './CustomButton.svelte';
    import TriviaIcon from './TriviaIcon.svelte';
    import ChooseCategory from './ChooseCategory.svelte';
    import {changePageToChooseCategory} from './utils';

    let hostId;
    let isHost;
    let users;
    let usersArray = [];
    let userId = getParams('userId');
    let categoryName;
    let noOfOnlinePlayers = 0;
    let disableStartGameBtn = false;
    let page;
    let roundValue;

    listenFirebaseKey(dbCategoryName,(dbCategoryNameRef)=>{
        dbCategoryNameRef.on('value',(snap)=>{
            if(!snap.exists()) {
                return;
            }
            categoryName = snap.val();
        })
    })

    dbUsers.on('value',(snap)=>{
        if(!snap.exists()) {
            return;
        }
        users = snap.val();
    })
    
    $: {
        if(users) {
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
        else {
            isHost = false;
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

    let changePage;
    const unsubscribe = changePageToChooseCategory.subscribe((value)=>{
        changePage = value;
    })

    listenFirebaseKey((dbPage),(dbPageRef)=>{
        dbPageRef.on('value',(snap)=>{
            if(!snap.exists()) {
                return;
            }
            page = snap.val();
        })
    })
    let disbleChooseCategory = false;
    function handleChooseCategory() {
        if(disbleChooseCategory) {
            return;
        }
        disbleChooseCategory = true;
        changePageToChooseCategory.set(1);
    }
    function handleChangeCategory() {
        changePageToChooseCategory.set(1);
    }

    function handleStartGame() {
        if(disableStartGameBtn) {
            return;
        }
        disableStartGameBtn = true;
        listenFirebaseKey(dbGameSessionRound,(dbGameSessionRoundRef)=>{
            dbGameSessionRoundRef.update({
                page : "Game",
                currentQuestionNumber : 0
            }).then(()=>{
                listenFirebaseKey(dbHostAction,(dbHostActionRef)=>{
                    dbHostActionRef.set({
                        action : "Start Game",
                        time : Date.now()
                    })
                })
            })
        })
    }

    function handleViewCategory() {
        changePageToChooseCategory.update((value)=>{
            return value + 1;
        })
    }

</script>
    {#if changePage === 1}
        <ChooseCategory/>
    {:else}
        <div class="welcomeContainer">
            <TriviaIcon/>
            <div class = "waitingMsg">
                {#if isHost}
                    {#if !categoryName}
                        Select a category
                    {:else if noOfOnlinePlayers >=2}
                        Start the game
                    {:else if noOfOnlinePlayers < 2}
                        Waiting for others to join
                        <div style = "font-size : 0.75rem; font-weight : 500; letter-spacing : 0.05rem">
                            Need atleast {2 - noOfOnlinePlayers} more players to start the game
                        </div>
                    {/if}
                {:else}
                    {#if !categoryName}
                        {#if hostName}
                            Ask {hostName}(host) to select a category
                        {:else}
                            Ask host to select a category
                        {/if}
                    {:else if noOfOnlinePlayers >= 2}
                        Waiting for {hostName}(Host) to start the game
                    {:else}
                        Waiting for others to join
                        <div style = "font-size : 0.75rem; font-weight : 500; letter-spacing : 0.05rem">
                            Need atleast {2 - noOfOnlinePlayers} more players to start the game
                        </div>
                    {/if}
                {/if}
            </div>
            <div class = "playersContainer">
                {#if hostId && users}
                    <div class="host">
                        <div class = "imageContainer" title = {users[hostId].userName} style = "width : 5rem; height : 5rem ;border : 0.25rem solid {users[hostId].isOnline?"#40BB45":"#AC312F"}">
                            {#if users[hostId].isOnline}
                                <Tick iconSize = "1rem"/>
                            {:else}
                                <DisconnectedSvg iconSize = "1rem"/>
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
                                        <Tick iconSize = "0.7rem"/>
                                    {:else}
                                        <DisconnectedSvg iconSize = "0.75rem"/>
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
            {#if categoryName}
                <div class="chooseCategoryContainer">
                    Choosen category - <span class = "categoryName" title = {isHost?"":"Host can change the category"}> {categoryName} </span> 
                    {#if isHost}
                        <span class = "changeCategory" on:click = {handleChangeCategory}> (change) </span>
                    {/if}
                </div>
            {/if}
            {#if isHost}
                {#if !categoryName}
                    <CustomButton btnText = {"Choose Category"} on:click = {handleChooseCategory} disableBtn = {disbleChooseCategory}/>
                {:else}
                    <div class="buttonContainer">
                        <!-- <CustomButton btnText = {"Change Category"} on:click = {handleChooseCategory} /> -->
                        <CustomButton btnText = {"Start Game"} on:click = {handleStartGame} disableBtn = {noOfOnlinePlayers < 2 || disableStartGameBtn} tooltipMsg = {noOfOnlinePlayers<2?"Number of online players are less than 2":""}/>
                        
                    </div>
                {/if}
            {:else}
                <CustomButton btnText = {"View Categories"} on:click = {handleViewCategory} disableBtn = {false}/>
            {/if}
        </div>
    {/if}
<style>
    ::-webkit-scrollbar {
        width: 10px;
    }
    ::-webkit-scrollbar-track {
        background-color: transparent;
    }
    ::-webkit-scrollbar-thumb {
        background-color : #ABABAB;
        border : 2px solid none;
        border-radius: 5px;
    }
    .welcomeContainer {
        display : flex;
        flex-direction: column;
        align-items: center;
        height : 100%;
    }
    .playersContainer {
        margin : auto;
        max-height : 70vh;
        overflow-y : auto;
    }
    .host,.normalPlayer {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom : 1rem;
    }
    .imageContainer {
        position: relative;
        width : 3rem;
        height : 3rem;
        border-radius : 50%;
        display : flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 0.25rem;
    }
    .profilePicture {
        border-radius : 50%;
        width : 100%;
        height : 100%;
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
        text-align : center;
    }
    .normalPlayerContainer {
        display : flex;
        justify-content: center;
        flex-wrap : wrap;
        max-height : 200px;
        min-width : 50vw;
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
        margin : 1rem 0rem;
        text-align : center;
        line-height: 1.5rem;
    }
    .buttonContainer {
        display : flex;
        gap : 1rem;
        justify-content: center;
        align-items: center;
    }
    .chooseCategoryContainer {
        font-family : 'Manrope';
        font-size : 0.85rem;
        font-weight : 400;
        color : #fff;
        margin : 1rem 0rem;
        letter-spacing : 0.025rem;
    }
    .categoryName {
        font-weight: 700;
    }
    .changeCategory {
        color : #ccc;
        cursor : pointer;
    }
</style>