<script>
    import TriviaIcon from './TriviaIcon.svelte';
    import {getParams} from './utils';
    import {dbUser,dbUsers,dbHost,dbAllQuestion,listenFirebaseKey,dbPage,dbCurrentQuestionNumber,dbGameSessionRoundValue,dbHalfTimer,dbHostAction} from './database';
    import {fly} from 'svelte/transition';
    import CustomButton from './CustomButton.svelte';
    import YouAreOffline from './YouAreOffline.svelte';
    import {info} from './Notifier';

    let userId = getParams('userId');
    let users;
    let usersArray = [];
    let hostId;
    let hostName;
    let isHost;
    let allQuestions;
    let currentQuestionNumber;
    let roundValue;
    let halfTime = 10;
    let noOfOnlinePlayers;

    dbGameSessionRoundValue.on('value',(snap)=>{
        if(!snap.exists()) {
            return;
        }
        roundValue = snap.val();
    })
    listenFirebaseKey(dbCurrentQuestionNumber,(dbCurrentQuestionNumberRef)=>{
        dbCurrentQuestionNumberRef.on('value',(snap)=>{
            if(!snap.exists()) {
                return;
            }
            currentQuestionNumber = snap.val();
        })
    })

    listenFirebaseKey(dbHalfTimer,(dbHalfTimerRef)=>{
        dbHalfTimerRef.on('value',(snap)=>{
            if(!snap.exists()) {
                return;
            }
            halfTime = snap.val();
        })
    })

    dbUsers.on('value',(snap)=>{
        if(!snap.exists()) {
            return;
        }
        users = snap.val();
    })
    dbHost.on('value',(snap)=>{
        if(!snap.exists()) {
            return;
        }
        hostId = snap.val();
    })
    $: {
        if(users) {
            noOfOnlinePlayers = 0;
            for(const id in users) {
                if(users[id].isOnline === true) {
                    noOfOnlinePlayers += 1;
                }
            }
            if(noOfOnlinePlayers <= 1) {
                dbGameSessionRoundValue.transaction((count)=>{
                    return count + 1;
                }).then(()=>{
                    info(`Game can't be continued due to less number of online players`,`Disconnected`,5000);
                })
            }
        }
    }
    $: {
        if(hostId && users) {
            hostName = users[hostId]['userName'].split(' ')[0];
        }
    }
    listenFirebaseKey(dbAllQuestion,(dbAllQuestionRef)=>{
        dbAllQuestionRef.on('value',(snap)=>{
            if(!snap.exists()) {
                return;
            }
            allQuestions = snap.val();
        }) 
    })
    let scoreOfUser = {};
    let scoreLeader;
    let scoreLeaderName;
    let isItTie = false;
    $: {
        if(allQuestions && users && currentQuestionNumber) {
            scoreOfUser = {};
            for(let i = 0; i<=currentQuestionNumber ; i++) {
                let currQuestionAnswers = allQuestions[i]['usersAnswers'];
                let correctOption = allQuestions[i]['correctOption'];
                for(const userId in currQuestionAnswers) {
                    let currUserAnswer = currQuestionAnswers[userId];
                    if(currUserAnswer === correctOption) {
                        if(scoreOfUser[userId] === undefined) {
                            scoreOfUser[userId] =  1
                        }
                        else {
                            scoreOfUser[userId] += 1;
                        }
                    }
                }
            }
            usersArray = [];
            for(const userId in users) {
                if(scoreOfUser[userId] === undefined) {
                    scoreOfUser[userId] = 0;
                }

                if(users[userId].isOnline) {
                   usersArray.push({
                       user : users[userId],
                       score : scoreOfUser[userId]
                   }) 
                }
            }
            console.log('usersArray before sorting ',usersArray);
            usersArray.sort((a,b)=>{
                return b.score - a.score;
            })
            usersArray = usersArray;
            if(usersArray.length === 1 || (usersArray.length>1 && usersArray[0].score > usersArray[1].score)) {
                scoreLeader = usersArray[0].user;
                scoreLeaderName = processName(usersArray[0].user);
                isItTie = false;
            }
            else if(usersArray.length) {
                scoreLeader = usersArray[0].user;
                isItTie = true;
            }
            console.log('usersArray after sorting ',usersArray);
        }
    }
    $: {
        if(hostId !== userId) {
            isHost = false;
        }
        else {
            isHost = true;
        }
    }
    
    function processName(user){
        let name = user.userName;
        let fname = name?.split(" ")[0];
        if(fname?.length > 10)
        {
            fname = name?.split(" ")[0].toUpperCase();
            if(name?.split(" ")[1].toUpperCase()) {
                fname += name?.split(" ")[1].toUpperCase();
            }
        }
        if(user.id === hostId) {
            if(userId === hostId) {
                fname = fname + " (You)";
            }
            else {
                fname = fname + " (Host)";
            }
        }
        else if(user.id === userId) {
            if(!isHost) {
                fname = fname + " (You)";
            }
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
    async function handleContinueButton() {
        if(currentQuestionNumber === 4) {
            listenFirebaseKey(dbHalfTimer,(dbHalfTimerRef)=>{
                dbHalfTimerRef.set(0);
            })
            listenFirebaseKey(dbHostAction,(dbHostActionRef)=>{
                dbHostActionRef.set({
                    action : "Continue Game",
                    time : Date.now()
                })
            })
        }
        else if(currentQuestionNumber === 9) {
            dbGameSessionRoundValue.set(roundValue + 1)
            .then(()=>{
                console.log('Round Value is incremented');
                listenFirebaseKey(dbHostAction,(dbHostActionRef)=>{
                    dbHostActionRef.set({
                        action : "Restart Game",
                        time : Date.now()
                    })
                })
            })
            .catch((err)=>{
                console.log('Something went wrong while incrementing round value ',err);
            });
        }
    }
    let backgroundColorMap = {
        0 : "#219653",
        1 : "#6FCF97",
        2 : "#F2C94C",
        3 : "#F2994A",
        4 : "#EB5757"
    }
    let scoreRemarkMap = {
        0 : "Excellent",
        1 : "Good",
        2 : "Average",
        3 : "Poor",
        4 : "Very poor"
    }
    function calculateGrade(get,total) {
        let grade = (get*100)/total;
        if(grade > 80) {
            return 0;
        }
        else if(grade > 70) {
            return 1;
        }
        else if(grade > 60) {
            return 2;
        }
        else if(grade > 50) {
            return 3;
        }
        else {
            return 4;
        }
    }
</script>
{#if usersArray.length}
    <div class="halfTime">
        <TriviaIcon/>
        <div class = "heading">
            {#if currentQuestionNumber === 4}
                <div class="text">
                    Half Time!
                </div>
            {:else if currentQuestionNumber === 9}
                {#if !isItTie && scoreLeader}
                    <div class="text">
                        {scoreLeader.id === userId?"You ":scoreLeaderName} won!
                    </div>
                    <div class="icon">
                        
                    </div>
                {:else if isItTie}
                    <div class="text">
                        It's a tie!
                    </div>
                    <div class="icon">
                        
                    </div>
                {/if}
            {/if}
        </div>
        <div class="message">
            {#if currentQuestionNumber === 4}
                5 more questions to go
            {:else if currentQuestionNumber === 9}
                {#if scoreOfUser[userId] < scoreOfUser[scoreLeader.id]}
                    Better luck next time
                {:else if !isItTie}
                    Well played
                {/if}
            {/if}
        </div>
        <div class = 'usersContainer' in:fly ="{{ y: -20, duration: 1000 }}">
            <div class="usersList">
                <div class="users">
                    {#each usersArray as currUser}
                        <div class="user" class:you = {currUser.user.id === userId} class:winner = {currUser.user.id === scoreLeader.id}>
                            <div class="userDetails">
                                {#if validUserProfilePicture(currUser.user.profilePicture)}
                                    <img class = "profilePicture" src = {currUser.user.profilePicture} alt = "UserProfilePicture">
                                {:else}
                                    <div class="fakeProfilePicture"> {currUser.user.userName[0].toUpperCase()} </div>
                                {/if}
                                {#if currUser.user.id === hostId}
                                    <div class = "name">
                                        {hostName}
                                    </div>
                                {:else}
                                    <div class = "name">
                                        {processName(currUser.user)} 
                                    </div>
                                {/if}
                            </div>
                            <div class="userScore" title = {scoreRemarkMap[calculateGrade(scoreOfUser[currUser.user.id],currentQuestionNumber + 1)]} style = "background : {backgroundColorMap[calculateGrade(scoreOfUser[currUser.user.id],currentQuestionNumber + 1)]}">
                                {scoreOfUser[currUser.user.id] !== undefined? scoreOfUser[currUser.user.id] : 0}/{currentQuestionNumber + 1}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
        {#if currentQuestionNumber === 4}
            <div class="message1">
                Continuing in {halfTime} sec...
            </div>
        {/if}
        {#if !isHost}
            <div class="message1" style = "margin-top : 0rem">
                {hostName} (Host) can continue the game!
            </div>
        {/if}
        {#if isHost}
            <CustomButton btnText = {currentQuestionNumber === 4?"Continue":"New Game"} on:click = {handleContinueButton}/>
        {/if}
    </div>
{:else}
    <YouAreOffline/>
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
    .halfTime {
        display: flex;
        flex-direction: column;
        align-items: center;
        height : 100%;
    }
    .heading {
        font-family : 'Manrope';
        font-weight : 700;
        font-size : 1.25rem;
        color : #fff;
        margin-top : 1rem;
    }
    .message {
        font-family : 'Manrope';
        font-weight : 400;
        font-size : 1rem;
        color : #fff;
        margin-top : 1rem;
    }
    .message1 {
        font-family : 'Manrope';
        font-weight : 700;
        font-size : 0.85rem;
        color : #fff;
        margin : 1rem;
    }
    .usersContainer{
        width : 30%;
        min-height : 100px;
        max-height : 40%;
        border-radius : 18px;
        background-color: #fff;
        margin : auto;
    }
    
    @media screen and (max-width : 1100px) {
        .usersContainer {
            width : 30%;
        }
    }
    @media screen and (max-width : 1000px) {
        .usersContainer {
            width : 35%;
        }
        :global(html) {
            font-size : 18px;
        }
    }
    @media screen and (max-width : 900px) {
        :global(html) {
            font-size : 16px;
        }
        .usersContainer {
            width : 40%;
        }
    }
    @media screen and (max-width : 800px) {
        .usersContainer {
            width : 45%;
        }
    }
    @media screen and (max-width : 700px) {
        .usersContainer {
            width : 50%;
        }
    }
    .usersList {
        width : 100%;
        height : 100%;
        padding : 10px;
    }
    .users{
        max-height : 100%;
        width : 100%;
        overflow-y: auto;
        display : flex;
        flex-direction: column;
        padding : 2px;
        gap : 0.25rem;
    }
    .user {
        display : flex;
        justify-content: space-between;
        align-items: center;
        padding : 10px 5px;
    }
    .you {
        background : #6C44A8;
        color : #fff;
        border-radius : 0.5rem;
    }
    .you .name {
        color : #fff;
    }
    .winner {
        background : #FFB64A;
        color : #fff;
        border-radius : 0.5rem;
    }
    .winner .name {
        color : #fff;
    }
    .userDetails {
        display : flex;
        justify-content: flex-start;
        align-items: center;  
    }
    .profilePicture {
        width : 20px;
        height : 20px;
        border-radius : 50%;
        margin-right : 5px;
    }
    .fakeProfilePicture {
        min-width : 20px;
        min-height : 20px;
        max-width : 20px;
        max-height : 20px;
        font-size : 12px;
        color : white;
        font-weight : 700;
        display : flex;
        font-family : 'Manrope';
        font-weight : 700;
        font-size : 0.75rem;
        justify-content: center;
        align-items : center;
        border-radius : 50%;
        background-color : #343E98;
        margin-right: 5px;
    }
    .name {
		font-family:  'Manrope';
        font-weight : 700;
        font-size : 0.75rem;
        color: #0C0030;
        white-space : nowrap;
    }
    .userScore {
        font-family:  'Manrope';
        font-weight : 700;
        font-size : 0.75rem;
        color: #fff;
        background : #333;
        padding : 0.2rem 0.4rem;
        border-radius : 0.2rem;
    }
</style>