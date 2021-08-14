<script>
    import TriviaIcon from './TriviaIcon.svelte';
    import {getParams} from './utils';
    import {dbUser} from './database';
    let userId = getParams('userId');
    let user;
    dbUser.on('value',(snap)=>{
        if(!snap.exists()) {
            return;
        }
        user = snap.val();
    })
</script>
<div class="offlineScreen">
    <TriviaIcon/>
    {#if user?.isOnline === false}
        <div class="offlineMsg">
            You are offline! <br>
            Please check your internet connection or reload
        </div>
    {/if}
</div>
<style>
    .offlineScreen {
        display: flex;
        flex-direction: column;
        align-items: center;
        height : 100%;
    }
    .offlineMsg {
        margin : auto;
        color : #fff;
        font-family : 'Manrope';
        font-size : 2rem;
        font-weight : 700;
        text-align :center;
        line-height : 2.5rem;
    }
</style>