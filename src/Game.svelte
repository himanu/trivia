<script>
    import TriviaIcon from './TriviaIcon.svelte';
    import {dbCurrentQuestionNumber,listenFirebaseKey,dbAllQuestion, dbQuestionTimer,dbUsers,dbGameSessionRoundValue,dbNextQuestionWaitingTimer} from './database'
    import { getParams } from './utils';
    import {fly} from 'svelte/transition';
    import RoundIndicator from './RoundIndicator.svelte';
    import {info} from './Notifier';
    import CustomButton from './CustomButton.svelte';
    import {onMount} from 'svelte';
    import Locked from './icons/Locked.svelte';
    import Unlocked from './icons/Unlocked.svelte';
    import CorrectAnswer from './icons/CorrectAnswer.svelte';
    import WrongAnswer from './icons/WrongAnswer.svelte';
    import NoAnswer from './icons/NoAnswer.svelte';

    let currentQuestionNumber;
    let allQuestions;
    let currentQuestionText;
    let options = [];
    let borderColor = "#27AE60";
    let questionTimer;
    let time = 0;
    let remTime;
    let users;
    let pageHasRefreshed = true;
    let interval;
    let requestAnimationFrameId;
    let nextQuestionWaitingTimer;
    let svgId;
    let setIntervalInterval;
    let stroke;
    let maxValueOfStroke;
    let strokeDashOffset;
    let stroke1;
    let initialTime = 31;
    let timeVal,timeVal1;
    let usersStatus = [];

    onMount(()=>{
        maxValueOfStroke = 2*(svgId.offsetWidth + svgId.offsetHeight);
        strokeDashOffset = (svgId.offsetWidth/2);
        stroke1 = maxValueOfStroke;
        stroke = 0;
    })

    listenFirebaseKey(dbNextQuestionWaitingTimer,(dbNextQuestionWaitingTimerRef)=>{
        dbNextQuestionWaitingTimerRef.on('value',(snap)=>{
            if(!snap.exists()) {
                nextQuestionWaitingTimer = undefined;
                return;
            }
            nextQuestionWaitingTimer = snap.val();
        })
    })
    listenFirebaseKey((dbCurrentQuestionNumber),(dbCurrentQuestionNumberRef)=>{
        dbCurrentQuestionNumberRef.on('value',(snap)=>{
            if(!snap.exists()) {
                return ;
            }
            currentQuestionNumber = snap.val();
            selectedOptionId = undefined;
            lockedOptionId = undefined;
            time = 0;
            questionTimer = 30;
            usersStatus = [];
            borderColor = "#27AE60";
            pageHasRefreshed = true;
            clearInterval(interval);
            interval = setInterval(()=>{
                time = 1;

                if(time === 1) {
                    clearInterval(interval);
                }
            },1000);
        })
    })
    $: {
        console.log('time ',time)
    }
    dbUsers.on('value',(snap)=>{
        if(!snap.exists()) {
            return;
        }
        users = snap.val();
    })
    let noOfOnlinePlayers = 0;
    $: {
        if(users && allQuestions && !(currentQuestionNumber == null)) {
            noOfOnlinePlayers = 0;
            usersStatus = [];
            let currentQuestionUsersAnswers = allQuestions[currentQuestionNumber]['usersAnswers'];
            let currentQuestionCorrectOption = allQuestions[currentQuestionNumber]['correctOption'];
            for(const id in users) {
                if(users[id].isOnline === true) {
                    noOfOnlinePlayers += 1;
                    let obj = {
                        userName : users[id]['userName'],
                        profilePicture : users[id]['profilePicture'],
                        id
                    }
                    if(currentQuestionUsersAnswers && !(currentQuestionUsersAnswers[id] == null)) {
                        obj['locked'] = true;
                        if(currentQuestionUsersAnswers[id] === currentQuestionCorrectOption) {
                            obj['answerStatus'] = 'correct';
                        }
                        else {
                            obj['answerStatus'] = 'wrong';
                        }
                    }
                    else {
                        obj['locked'] = false;
                    }
                    usersStatus.push(obj);
                }
            }
            usersStatus = usersStatus;
            console.log('usersStatus ',usersStatus);
            if(noOfOnlinePlayers <= 1) {
                dbGameSessionRoundValue.transaction((count)=>{
                    return count + 1;
                }).then(()=>{
                    info(`Game can't be continued due to less number of online players`,`Disconnected`,5000);
                })
            }
        }
    }
    
    let opacityOfContainer;
    $: {
        if(time === 0) {
            opacityOfContainer = 0.5;
        }
        else {
            opacityOfContainer = 1;
        }
    }

    

    listenFirebaseKey(dbQuestionTimer,(dbQuestionTimerRef)=>{
        dbQuestionTimerRef.on('value',(snap)=>{

            if(!snap.exists()) {
                questionTimer = 30;
            }
            else {
                initialTime = snap.val();
                if(snap.val() >= 31) {
                    remTime = 30;
                }
                else {
                    remTime = snap.val();
                }
            }
    
            // questionTimer = remTime/1000;
            questionTimer = remTime;
            if(questionTimer > 15) {
                borderColor = "#27AE60";
            }
            else if(questionTimer > 5) {
                borderColor = "#F2C94C";
            }
            else if(questionTimer > 0) {
                borderColor = "#C81919";
            }
            // clearInterval( setIntervalInterval );
            timeVal1 = initialTime;
            if(initialTime === 0) {
                cancelAnimationFrame(requestAnimationFrameId);
                stroke = 0;
                stroke1 = maxValueOfStroke - stroke;
            }
            else if(initialTime < 31 && pageHasRefreshed) {
                pageHasRefreshed = false;
                prev = null;
                timeVal = initialTime;
                cancelAnimationFrame(requestAnimationFrameId);
                requestAnimationFrameId = requestAnimationFrame(setStroke);
            }
        })
    })

    let prev,curr,elapsed;
    function setStroke(timeStamp) {
        if(!prev) {
            prev = timeStamp;
            timeVal = timeVal1;
        }
        else {
            curr = timeStamp;
            elapsed = curr - prev;
            timeVal = timeVal - elapsed/1000;
            prev = curr;
        }
        maxValueOfStroke = 2*(svgId.offsetWidth + svgId.offsetHeight);
        strokeDashOffset = 1*(svgId.offsetWidth/2);
        if(timeVal <= 0) {
            cancelAnimationFrame(requestAnimationFrameId)
            prev = null;
            stroke = 0;
            stroke1 = maxValueOfStroke - stroke;
        }
        else {
            stroke = (30 - timeVal)*(maxValueOfStroke)/30;
            stroke1 = maxValueOfStroke - stroke;
            requestAnimationFrameId = requestAnimationFrame(setStroke);
        }
    }
    
    listenFirebaseKey(dbAllQuestion,(dbAllQuestionsRef)=>{
        dbAllQuestionsRef.on('value',(snap)=>{
            if(!snap.exists()) {
                return;
            }
            allQuestions = snap.val();
        })
    })
    
    let selectedOptionId;
    let lockedOptionId;
    let userId = getParams('userId');
    let answerStatus = [];
    let usersAnswers;
    let answerOptionId;
    $: {
        if(allQuestions != undefined && currentQuestionNumber != undefined) {
            answerStatus = [];
            currentQuestionText = allQuestions[currentQuestionNumber].question;
            usersAnswers = (allQuestions[currentQuestionNumber]['usersAnswers']);
            answerOptionId = allQuestions[currentQuestionNumber]['correctOption'];
            if(usersAnswers) {
                lockedOptionId = usersAnswers[userId];
            }

            options = [];
            for(let i = 0; i<=3 ; i++) {
                options.push( { optionText : allQuestions[currentQuestionNumber][i], optionId : i} )
            }
            for(let i = 0; i<currentQuestionNumber ; i++) {
                let currentQuestionUsersAnswers = allQuestions[i]['usersAnswers'];
                if(!currentQuestionUsersAnswers || currentQuestionUsersAnswers[userId] === undefined) {
                    answerStatus.push(2);
                }
                else if(allQuestions[i]['usersAnswers'][userId] === allQuestions[i]['correctOption']) {
                    answerStatus.push(1);
                }
                else {
                    answerStatus.push(0);
                }
            }
            for(let i = currentQuestionNumber; i<10 ; i++) {
                if(i === currentQuestionNumber) {
                    answerStatus.push(3);
                }
                else {
                    answerStatus.push(2);
                }
            }
        }
    }
    $: {
        if(questionTimer === 0 && allQuestions && currentQuestionNumber != undefined && currentQuestionNumber !== null) {
            if(answerOptionId === lockedOptionId) {
                borderColor = "#27AE60";
            }
            else if(lockedOptionId != undefined){
                borderColor = "#C81919";
            }
            else {
                borderColor = "#4F4F4F";
            }
        }
    }
    
    function handleLockInBtn() {
        if(selectedOptionId == null) {
            return ;
        }
        // selectedOptionId = optionId;
        listenFirebaseKey(dbAllQuestion,(dbAllQuestionRef)=>{
            dbAllQuestionRef.child(currentQuestionNumber).child('usersAnswers').child(userId).set(selectedOptionId);
        })
    }
    function handleOptionClick(option) {
        if(lockedOptionId == null) {
            selectedOptionId = option.optionId;
            return;
        } 
        console.log('Answer is alreay locked');
    }
    let colorMap = {
        0 : "#C81919",
        1 : "#27AE60",
        2 : "#C4C4C4",
        3 : "#6C44A8"
    }
    let titleMap = {
        0 : "Wrong Answer given",
        1 : "Correct Answer given",
        2 : "No answer given",
        3 : "Current Question"
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
    function processName(user){
        let name = user.userName;
        let fname = name?.split(" ")[0];
        if(fname?.length > 7)
        {
            fname = name?.split(" ")[0][0].toUpperCase();
            if(name?.split(" ")[1][0].toUpperCase()) {
                fname += name?.split(" ")[1][0].toUpperCase();
            }
        }
        if(user.id === userId) {
            fname = fname + "(You)";
        }
        return fname;
    }
    let showPlayersStatus = false;
    let playerStatusText = "Players Status";
    function handleShowPlayerStatus() {
        if(showPlayersStatus === false) {
            showPlayersStatus = true;
            playerStatusText = 'Hide';
        }
        else if(showPlayersStatus === true) {
            showPlayersStatus = false;
            playerStatusText = 'Players Status';
        }
    }
</script>
<div class = "gameContainer" onmousedown="return false" onselectstart="return false"> 
    {#if time === 0}
        <RoundIndicator roundValue = {currentQuestionNumber + 1} msg = {"Question"}/>
    {/if}
    <TriviaIcon/>
    <div class="playersStatus" on:click = {handleShowPlayerStatus} >
        {playerStatusText}
    </div>
    <div class="parentContainer">
        <div class="otherPlayerStatus" class:showPlayersStatus = {showPlayersStatus}>
            <div class="playerStatusHeading">
                Players Status
            </div>
            <div style = "position : relative; flex-grow : 100 ; overflow-y : auto">
                <div class="playerContainer" in:fly ="{{ y: -20, duration: 1000 }}">
                    {#each usersStatus as player}
                        <div class="player" class:lockedPlayer = {player.locked} title = {player.locked?`${player.userName} has locked his answer`:`${player.userName} hasn't locked his answer`}>
                            <div class="playerDetails">
                                {#if validUserProfilePicture(player.profilePicture)}
                                    <img class = "profilePicture" src = {player.profilePicture} alt = "UserProfilePicture">
                                {:else}
                                    <div class="fakeProfilePicture"> {player.userName[0].toUpperCase()} </div>
                                {/if}
                                <div class="playerName">   
                                    {processName(player)} 
                                </div>
                            </div>
                            <div class="answerStatus">
                                {#if questionTimer && player.locked}
                                    <Locked/>
                                {:else if questionTimer}
                                    <Unlocked/>
                                {:else if questionTimer === 0}
                                    {#if player['answerStatus'] === 'correct'}
                                        <CorrectAnswer/>
                                    {:else if player['answerStatus'] === 'wrong'}
                                        <WrongAnswer/>
                                    {:else}
                                        <NoAnswer/>
                                    {/if}
                                {/if}
                            </div>
                        </div>
                    {/each}
                
                
                </div>
            </div>
        </div>
        <div class = "answerScreenContainer" class:reduceOpacityOfAnswerScreenContainer = {showPlayersStatus} in:fly ="{{ y: -20, duration: 1000 }}">
            <div class="questionTimerContainer">
                {#if questionTimer != undefined}
                    <div class="questionTimer" style = "background : {borderColor}" class:timesUp = {questionTimer === 0 && lockedOptionId == null}>
                        {#if questionTimer > 9}
                            0:{questionTimer}
                        {:else if questionTimer > 0}
                            0:0{questionTimer}
                        {:else if questionTimer === 0}
                            {#if answerOptionId === lockedOptionId}
                                Correct!
                            {:else if lockedOptionId != undefined}
                                Wrong!
                            {:else}
                                Times Up!
                            {/if}
                        {/if}
                    </div>
                {:else }
                    <div class="questionTimer" style = "background : {borderColor}">
                        0:30
                    </div>
                {/if}
            </div>
            <div class="svgContainer" bind:this={svgId}>
                <svg class = "svg" width = "100%" height = "100%">
                    <rect x="0" y="0" width="100%" height="100%" fill = "{borderColor}" stroke-dashoffset = "{-1*strokeDashOffset}" stroke-dasharray = "{stroke} , {stroke1}"/>
                </svg>
            </div>
            <div class = "answerScreenParent" onmousedown="return false" onselectstart="return false">
                <div class="answerScreen">
                    <div class="question" onmousedown="return false" onselectstart="return false">

                        {#if currentQuestionText}
                            {currentQuestionText}
                        {/if}
                    </div>
                    <div class = "allOptions">
                        {#each options as option}
                            {#if questionTimer === 0 }
                                {#if option.optionId === answerOptionId}
                                    <div class="correctOption">
                                        {option.optionText}
                                    </div>
                                {:else if option.optionId === lockedOptionId}
                                    <div class="wrongOption" >
                                        {option.optionText}
                                    </div>
                                {:else}
                                    <div class="simpleOption">
                                        {option.optionText}
                                    </div>
                                {/if}
                            {:else}
                                <div class="option" class:hoverOption = {lockedOptionId == null && selectedOptionId != option.optionId} class:selectedOption = {option.optionId === selectedOptionId} style = "cursor : {lockedOptionId == null?"pointer":""}" on:click = {()=>handleOptionClick(option)}>
                                    {option.optionText}
                                </div>
                            {/if}
                        {/each}
                    </div>
                    <div>
                        <div class="lockInBtn">
                            {#if questionTimer}
                                {#if lockedOptionId == null}
                                    <CustomButton on:click = {handleLockInBtn} btnText = 'Lock In' disableBtn = {selectedOptionId == null} tooltipMsg = {(selectedOptionId == null)?'Select a option':'Are you sure to lock selected option?' }/>
                                {:else}
                                    <div class="waiting">
                                        Waiting for others...
                                    </div>
                                {/if}
                            {:else if questionTimer === 0 && nextQuestionWaitingTimer}
                                <div class="waiting">
                                    {#if currentQuestionNumber === 4 || currentQuestionNumber === 9}
                                        Leaderboard in... {nextQuestionWaitingTimer}
                                    {:else}
                                        Next question in... {nextQuestionWaitingTimer} 
                                    {/if}
                                </div>
                            {/if}
                        </div>
                        <div class = "allAnswers">
                            {#each answerStatus as status}
                                {#if status !== 3}
                                    <div title = {titleMap[status]}>
                                        <svg height="1rem" width="1rem">
                                            <circle cx="0.5rem" cy="0.5rem" r="0.5rem" fill = {colorMap[status]}/>
                                        </svg> 
                                    </div>
                                {:else}
                                    <div class = "currentQuestionContainer" title = {titleMap[status]}>
                                        <svg height="2rem" width="2rem">
                                            <circle cx="1rem" cy="1rem" r="1rem" fill = {"#6C44A8"}/>
                                        </svg> 
                                        <div class = "currentQuestion">
                                                {currentQuestionNumber + 1}
                                        </div>
                                    </div>
                                {/if}
                            {/each}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<style>
    ::-webkit-scrollbar {
        width: 8px;
    }
    /* Track */
    ::-webkit-scrollbar-track {
        background : initial;
        border-radius : 4px;
    }

    /* Handle */
    ::-webkit-scrollbar-thumb {
        background: #172072;;
        border-radius : 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
        background: #0e1346;
    }
    .gameContainer {
        display : flex;
        flex-direction: column;
        align-items: center;
        height : 100%;
        overflow-y: auto;
        overflow-x : hidden;
    }
    .parentContainer {
        display: flex;
        width : 100%;
        margin : auto;
        justify-content: center;
    }
    .otherPlayerStatus {
        display : flex;
        justify-content: center;
        position : relative;
        flex-grow : 100;
        padding : 0.5rem;
        background : #fff;
        border-radius : 1rem;
        margin-left : calc(12.5vw + 1rem);
        border : 0.5rem solid #6C44A8;
    }
    .playerStatusHeading, .playersStatus {
        position : absolute;
        font-family: 'Manrope';
        font-size : 0.75rem;
        font-weight: 700;
        background-color : #6C44A8;
        color : #fff;
        padding : 0.25rem 0.5rem;
        border-radius: 0.25rem;
        white-space: nowrap;
    }
    .playerStatusHeading {
        top : -0.85rem;
    }
    .playersStatus {
        display : none;
        visibility: hidden;
        bottom : 0;
    }
    @media screen and (max-width : 600px) {
        .playersStatus {
            display :block;
            visibility: visible;
            cursor : pointer;
            z-index : 2;
        }
        .reduceOpacityOfAnswerScreenContainer {
            opacity : 0.5;
        }
    }
    .playerContainer {
        position : absolute;
        padding : 0.5rem;
        display : flex;
        flex-direction: column;
        gap : 1rem;
        align-items: center;
        width : calc(100% - 1rem);
        overflow-y : auto;
        flex-grow : 100;
    }
    .player {
        display : flex;
        justify-content: space-between;
        align-items: center;
        width : 100%;
        color : #333;
        padding : 0.5rem;
        border-radius : 0.5rem;
        border : 2px solid #D9D9D9
    }
    .lockedPlayer {
        background-color: #fff;
        color : #333;
        border : 2px solid #6C44A8
    }
    .playerDetails {
        display : flex;
        gap : 5px;
        max-width: 80%;
        justify-content: flex-start;
        align-items: center;
    }
    .profilePicture {
        width : 20px;
        height : 20px;
        border-radius : 50%;
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
    .playerName {
        font-family:  'Manrope';
        font-weight : 700;
        font-size : 0.75rem;
        white-space : nowrap;
    }
    .answerStatus {
        width : 20px;
        height : 20px;
        border-radius: 50%;
    }
    .answerScreenContainer {
        margin : auto 12.5vw auto 0;
        padding : 0rem 1rem;
        position : relative;
        width : 50vw;
    }
    @media screen and (max-width : 1150px) {
        .otherPlayerStatus {
            margin-left : calc(10vw + 1rem);
        }
        .answerScreenContainer {
            margin-right : 10vw;
        }
    }
    @media screen and (max-width : 900px) {
        .otherPlayerStatus {
            margin-left : calc(8vw + 1rem);
        }
        .answerScreenContainer {
            margin-right : 8vw;
        }
    }
    @media screen and (max-width : 800px) {
        .otherPlayerStatus {
            margin-left : calc(3vw + 1rem);
        }
        .answerScreenContainer {
            margin-right : 3vw;
            width : 55vw;
        }
    }
    @media screen and (max-width : 700px) {
        .otherPlayerStatus {
            margin-left : calc(1vw + 1rem);
        }
        .answerScreenContainer {
            margin-right : 1vw;
        }
    }
    @media screen and (max-width : 600px) {
        .otherPlayerStatus {
            position : absolute;
            z-index : 1;
            top : calc(100% + 4rem);
            margin-left : 0;
            transition : top 2s linear;
            min-width : 55vw;
            min-height : 40vh;
        }
        .showPlayersStatus {
            top : 50%;
            transform : translateY(-50%);
        }
        .answerScreenContainer {
            width : 70vw;
        }
    }
    .svgContainer {
        position: absolute;
        width: calc(100% - 2rem);
        height: 100%;
        border-radius: 1rem;
        overflow: hidden;
    }
    .svg > *{
		stroke-width: 2rem;
		stroke: #ccc;
	}
    .answerScreenParent {
        position : relative;
        padding : 0.5rem;
        border-radius: 1rem;
        display : flex;
        flex-direction : column;
        align-items: center;
        overflow :visible;
        width : 100%;
    }
    .answerScreen {
        display : flex;
        flex-direction:  column;
        padding: 0.8rem;
        overflow-y : auto;
        overflow-x : visible;
        gap : 2rem;
        background : #fff;
        border-radius : 1rem;
        width : 100%;
    }
    
    @media screen and (max-width : 600px) {
        .answerScreen {
            gap : 1.5rem;
        }
    }

    @media screen and (max-width : 500px) {
        .answerScreen {
            gap : 1rem;
        }
    }

    .question {
        font-family : 'Manrope';
        font-size : 1rem;
        font-weight : 800;
        max-width : 80%;
        margin : 0rem auto;
        text-align : center;
        line-height : 1.25rem;
        color : #333;
    }
    .allOptions {
        display : grid;
        grid-template-columns: repeat(2,1fr);
        gap : 1rem;
        width : 100%;
        margin : 0rem auto;
    }
    @media screen and (max-width : 550px) {
        .allOptions {
            display : flex;
            flex-direction: column;
        }
    }
    .option,.selectedOption,.correctOption,.wrongOption,.simpleOption {
        border : 2px solid #D9D9D9;
        border-radius: 1rem;
        color : #414141;
        padding : 0.75rem 1rem;
        text-align : center;
        font-family: 'Manrope';
        font-size : 0.75rem;
        font-weight : 700;
        display : flex;
        justify-content: center;
        align-items : center;
    }
    .selectedOption {
        color : #fff;
        background : #6C44A8;
        border : 0px solid #fff;
        box-shadow : 1px 1px 10px #6C44A8;
    }
    .correctOption {
        background : #27AE60;
        color : #fff;
        animation  : animateOption 2s 1;
        border : 0px solid #fff;
        box-shadow : 1px 1px 10px #27Ae60
    }
    .wrongOption {
        background: #C81919;
        color : #fff;
        border : 0px solid #fff;
    }
    .hoverOption:hover {
        transform : scale(1.02);
    }
    @keyframes animateOption {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.025);
        }
        100% {
            transform: scale(1);
        }
    }
    .questionTimerContainer {
        position : absolute;
        display : flex;
        width : calc(100% - 2rem);
        justify-content: center;
        align-items: center;
        height: 1.5rem;
        top : -0.5rem
    }
    .questionTimer {
        padding : 0.25rem 0.5rem;
        font-family: 'Manrope';
        font-size : 0.75rem;
        font-weight : 700;
        color : #fff;
        border-radius : 0.25rem;
        z-index : 100;
    }
    .timesUp {
        animation  : animateTimesUp 2s 1; 
        background : #4f4f4f;
        padding : 0.25rem 0.5rem;
    }
    @keyframes animateTimesUp {
        33% {
            transform : rotate(10deg);
        }
        66% {
            transform: rotate(-10deg);
        }
        99% {
            transform: rotate(0deg);
        }
    }
    .allAnswers {
        display : flex;
        flex-wrap: wrap;
        justify-content: center;
        gap : 0.5rem;
        align-items: center;
    }
    .currentQuestionContainer {
		position : relative;
		width : 2rem;
		height : 2rem;
	}
	.currentQuestion {
		position : absolute;
		top : 50%;
		left : 50%;
		transform : translate(-50%,-50%);
		color : #fff;
        font-family: 'Manrope';
        font-size : 0.75rem;
        font-weight : 700;
	}
    .lockInBtn {
        display : flex;
        justify-content: center;
        margin : 0rem auto;
        height : 2rem;
        align-items: center;
        margin-bottom: 0.15rem;
    }
    .waiting {
        color : #6C44A8;
        font-family: 'Manrope';
        font-size : 0.85rem;
        font-weight : 800;
    }
</style>