<script>
    import TriviaIcon from './TriviaIcon.svelte';
    import {dbCurrentQuestionNumber,listenFirebaseKey,dbAllQuestion, dbQuestionTimer} from './database'
    import { getParams } from './utils';
    import {fly} from 'svelte/transition';
    import RoundIndicator from './RoundIndicator.svelte';

    let currentQuestionNumber;
    let allQuestions;
    let currentQuestionText;
    let options = [];
    let borderColor = "#27AE60";
    let questionTimer;
    let time = 0;
    let setTimeoutInterval;
    let remTime;
    let currTime;
    let stroke = 0;
    let stroke1 = 400  - stroke;

    listenFirebaseKey((dbCurrentQuestionNumber),(dbCurrentQuestionNumberRef)=>{
        dbCurrentQuestionNumberRef.on('value',(snap)=>{
            if(!snap.exists()) {
                return ;
            }
            currentQuestionNumber = snap.val();
            selectedOptionId = undefined;
            time = 0;
            clearInterval(setTimeoutInterval);
            setTimeoutInterval =  setTimeout(()=>{
                time += 1;
            },1000);
        })
    })
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
                questionTimer = undefined;
                return;
            }
            if(snap.val() >= 31) {
                remTime = 30;
            }
            else {
                remTime = snap.val();
            }
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
        })
    })
    let interval;
    
    $:{
        if(interval) {
            clearInterval(interval);
        } 
        interval = setInterval(()=>{
            remTime = remTime - (10/1000);
            console.log(remTime);
            currTime = 30 - remTime;
            stroke = (currTime*(400))/30;
            stroke1 = 400 - stroke
            if(( remTime ) <=0) {
                clearInterval(interval);
            }
        },10);
    }
    $: {
        if(currentQuestionNumber === 14 & questionTimer === undefined) {
            questionTimer = 0;
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
                selectedOptionId = usersAnswers[userId];
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
        if(questionTimer === 0 && allQuestions && currentQuestionNumber) {
            if(answerOptionId === selectedOptionId) {
                borderColor = "#27AE60";
            }
            else if(selectedOptionId != undefined){
                borderColor = "#EB5757";
            }
            else {
                borderColor = "#6C44A8";
            }
        }
    }
    
    function handleOptionClick(optionId) {
        if(selectedOptionId !== undefined) {
            return ;
        }
        // selectedOptionId = optionId;
        listenFirebaseKey(dbAllQuestion,(dbAllQuestionRef)=>{
            dbAllQuestionRef.child(currentQuestionNumber).child('usersAnswers').child(userId).set(optionId);
        })
    }
    let colorMap = {
        0 : "#EB5757",
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
    
    
</script>
<div class = "gameContainer"> 
    {#if time === 0}
        <RoundIndicator roundValue = {currentQuestionNumber + 1} msg = {"Question"}/>
    {/if}
    <TriviaIcon/>
    <div class = "answerScreenContainer" in:fly ="{{ y: -20, duration: 1000 }}" style = "opacity : {opacityOfContainer}">
        <svg class = "svg" width = "100%" height = "100%">
			<rect x="0" y="0" width="100%" height="100%" rx = "1rem" ry = "1rem" fill = "{borderColor}" stroke-dashoffset = "-60%" stroke-dasharray = "{stroke + '%'} , {stroke1 + '%'}"/>
        </svg>
        <div class="answerScreen">
            {#if questionTimer != undefined}
                <div class="questionTimer" style = "background : {borderColor}">
                    {#if questionTimer > 9}
                        0:{questionTimer}
                    {:else if questionTimer > 0}
                        0:0{questionTimer}
                    {:else if questionTimer === 0}
                        {#if answerOptionId === selectedOptionId}
                            Correct!
                        {:else if selectedOptionId != undefined}
                            Wrong!
                        {:else}
                            Times Up!
                        {/if}
                    {/if}
                </div>
            {/if}
            <div class="question">
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
                        {:else if option.optionId === selectedOptionId}
                            <div class="wrongOption" >
                                {option.optionText}
                            </div>
                        {:else}
                            <div class="simpleOption">
                                {option.optionText}
                            </div>
                        {/if}
                    {:else}
                        <div class="option" class:selectedOption = {option.optionId === selectedOptionId} style = "cursor : {selectedOptionId === undefined?"pointer":""}" on:click = {() => handleOptionClick(option.optionId)}>
                            {option.optionText}
                        </div>
                    {/if}
                {/each}
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
    }
    .answerScreenContainer {
        margin : auto 0;
        padding : 0rem 1rem;
        width : 60vw;
        min-height : 26vw;
        position : relative;
    }
    @media screen and (max-width : 1200px) {
        .answerScreenContainer {
            width : 70vw;
        }
    }
    @media screen and (max-width : 1000px) {
        .answerScreenContainer {
            width : 80vw;
        }
    }
    @media screen and (max-width : 900px) {
        .answerScreenContainer {
            width : 90vw;
        }
    }
    
    .svg > *{
		stroke-width: 1rem;
		stroke: #ccc;
        stroke-linecap: round;
	}
    .answerScreen {
        background-color: #fff;
        padding : 1rem;
        width : calc(100% - 3rem);
        height : calc(100% - 1rem);
        display : flex;
        flex-direction : column;
        align-items: center;
        position : absolute;
        top : 50%;
        left : 50%;
        transform : translate(-50%,-50%);
        border-radius: 1rem;
    }
    .question {
        font-family : 'Manrope';
        font-size : 1rem;
        font-weight : 800;
        max-width : 80%;
        margin : auto;
        text-align : center;
        line-height : 1.25rem;
        color : #333;
    }
    .allOptions {
        display : grid;
        grid-template-columns: repeat(2,1fr);
        gap : 1rem;
        width : 100%;
        margin-bottom : 1rem;
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
    }
    .selectedOption {
        color : #fff;
        background : #6C44A8;
    }
    .correctOption {
        background : #27AE60;
        color : #fff;
        animation  : animateOption 3s 1
    }
    .wrongOption {
        background: #EB5757;
        color : #fff;
    }
    @keyframes animateOption {
         0% {
            font-size : 0.75rem;
        }
        50% {
            font-size : 1.25rem;
        }
        100% {
            font-size : 0.75rem;
        }
    }
    .questionTimer {
        padding : 0.25rem 0.5rem;
        font-family: 'Manrope';
        font-size : 0.75rem;
        font-weight : 700;
        color : #fff;
        position : absolute;
        bottom : 100%;
        left : 50%;
        transform: translateX(-50%);
        border-radius : 0.25rem;
        z-index : 100;
    }
    .allAnswers {
        display : flex;
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
</style>