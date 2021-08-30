const functions = require("firebase-functions");
const admin = require('firebase-admin');
const axios = require('axios');
admin.initializeApp();
const runtimeOpts = {
  timeoutSeconds: 200
}

exports.updateIsOnlineKey = functions.database.ref('/trivia/{gameSessionId}/users/{userId}/online')
  .onUpdate((change,context)=>{
    let userRef = change.after.ref.parent;
    if(change.after.val() === 'online') {
      console.log('user is set online1');
      return userRef.update({
        isOnline : true
      });
    }
    else {
      return new Promise((resolve,reject)=>{
        setTimeout(()=>{
          userRef.get().then((snap)=>{
            if(!snap.exists()) {
              resolve();
            }
            let isOnline;
            if(snap.val().online === true) {
              console.log('user is set online2');
              isOnline = true;
            }
            else if( Date.now() - snap.val().online > 5000){
              console.log('user is set offline');
              isOnline = false;
            }
            else {
              console.log('user is set online3');
              isOnline = true;
            }
            userRef.update({
              isOnline
            }).then(()=>{
              resolve();
            })
            .catch(()=>{
                resolve();
                console.error(`Can't be able to update isOnline`);
            })
          })
          .catch(()=>{
            console.error('Can get users');
            resolve();
          })
        },5000)
      })
    }
  })

exports.removeHostWhenOffline = functions.database.ref('/trivia/{gameSessionId}/users/{id}/isOnline')
  .onUpdate(async(change,context)=>{
    let userOnlineStatus = change.after.val();
    let userId = context.params.id;
    let hostRef = change.after.ref.parent.parent.parent.child('host');
    let hostId;
    let hostSnap;
    if(userOnlineStatus === false) {
      return new Promise(async(resolve,reject)=>{
        hostSnap = await hostRef.get();
        if(!hostSnap.exists()) {
          console.log('Host not exists');
          resolve();
          return;
        } 
        hostId = hostSnap.val();
        console.log('Host Id ',hostId);
        if(hostId === userId) {
          console.log('Host went offline');
          hostRef.remove().then(()=>{
            console.log('Host get removed');
            resolve();
          })
          .catch(()=>{
            console.error('Error occur while removing host');
            resolve();
          });
        }
        else {
          console.log('Current id not equal to hostid');
          resolve();
        }
      })
    }
    else {
      console.log('Nothing to change');
      return null;
    }
  })
exports.hostDelete = functions.database.ref("/trivia/{gameSessionId}/host")
  .onDelete((snap, context) => {
    const oldHostId = snap.val();
    const usersRef = snap.ref.parent.child("users");
    let users,usersSnap;
    return new Promise(async(resolve,reject)=>{
      try {
        usersSnap = await usersRef.get();
        if(!usersSnap.exists()) {
          console.log('Users not exist');
          resolve();
          return;
        }
        users = usersSnap.val();
        console.log('users ',users);
        let usersArray = [];
        for(const id in users) {
          usersArray.push(users[id]);
        }
        console.log('usersArray ',usersArray);
        let onlineUsers = usersArray.filter( user => user.isOnline === true && user.id !== oldHostId);
        console.log('Online users ',onlineUsers);
        shuffle(onlineUsers);
        const newHost = onlineUsers[0];
        if (newHost) {
          console.log('new host ',newHost);
          snap.ref.set(newHost.id)
          .then(()=>{
            console.log('Host id set success');
            resolve();
          })
          .catch(()=>{
            console.error('Host id set fail');
            resolve();
          });
        }
        else {
          console.error('No online users');
          resolve();
        }
      }
      catch(err) {
        console.error('Something went wrong ',err);
        resolve();
      }
    })
  });

exports.setTimerTo0WhenEveryoneHaveAnswered = functions.database.ref(`/trivia/{gameSessionId}/rounds/{roundValue}/allQuestions/{questionNumber}/usersAnswers/`)
  .onWrite(async(change,context)=>{
    let usersAnswers = change.after.val();
    console.log('usersAnswers ',usersAnswers);
    let usersRef = change.after.ref.parent.parent.parent.parent.parent.child('users');
    let users,usersSnap;
    try {
      usersSnap = await usersRef.get();
      if(!usersSnap.exists()) {
        console.log('Something went wrong while getting users information');
        return null;
      }
      users = usersSnap.val();
      console.log('users ',users);
      let f = 0;
      for(const userId in users) {
        if(users[userId].isOnline === true && (usersAnswers[userId] === undefined || usersAnswers[userId] === null) ) {
          f = 1;
          break;
        }
      }
      if(f === 1) {
        console.log('All users have not given answer');
        return null;
      }
      else {
        console.log('All users have given answer');
        let questionTimerRef = change.after.ref.parent.parent.parent.child('questionTimer');
        questionTimerRef.set(0)
        .then(()=>{
          console.log('Question timer  is changed to 0');
        })
        .catch((err)=>{
          console.error('Some error occur ',err);
        });
      }
     }
    catch(err) {
      console.error('Something went wrong ',err);
    }
  })  

exports.setTimerOnChangeOfNumberOfOnlineUsers = functions.database.ref(`/trivia/{gameSessionId}/users`)
  .onUpdate(async(change,context)=>{
    return new Promise(async(resolve,reject)=>{
      let users = change.after.val();
      let roundValueRef = change.after.ref.parent.child('roundValue');
      let roundValueSnap = await roundValueRef.get().catch((err)=>{
        console.log('err ',err);
        resolve();
      });
      if(!roundValueSnap.exists() || !roundValueSnap.val() ) {
        resolve();
        return ;
      }
      let roundValue = roundValueSnap.val();
      console.log('roundValue ',roundValue);
      let currentQuestionNumberRef = change.after.ref.parent.child('rounds').child(roundValue).child('currentQuestionNumber');
      let allQuestionsRef = change.after.ref.parent.child('rounds').child(roundValue).child('allQuestions');
      let allQuestions,currentQuestionNumber;
      
      Promise.all([currentQuestionNumberRef.get(),allQuestionsRef.get()])
      .then((snap)=>{
        currentQuestionNumber =  snap[0].val();
        allQuestions = snap[1].val();
        if(!allQuestions || currentQuestionNumber === undefined || currentQuestionNumber === null) {
          resolve();
          return;
        }
        console.log('currentQuestionNumber ',currentQuestionNumber);
        let allOnlineUsersHaveGivenAnswer = true;
        for(const userId in users) {
          let currUserAnswer = allQuestions[currentQuestionNumber]['usersAnswers'][userId];
          if(users[userId].isOnline === true && (currUserAnswer === undefined || currUserAnswer === null)) {
            allOnlineUsersHaveGivenAnswer = false;
            break;
          }
        }
        if(allOnlineUsersHaveGivenAnswer) {
          console.log('all online users have given the answer');
          let questionTimerRef = allQuestionsRef.parent.child('questionTimer');
          questionTimerRef.set(0).then(()=>{
            console.log('Question timer is set to 0');
            resolve();
          })
          .catch((err)=>{
            console.log('Error ',err);
            resolve();
          })
        }
        else {
          resolve();
        }
      })
      .catch((err)=>{
        console.error('error ',err);
        resolve();
      })
    })
  })


exports.changeToBeMadeWhenCurrentQuestionNumberChange = functions.database.ref('/trivia/{gameSessionId}/rounds/{roundValue}/currentQuestionNumber/')
  .onWrite((change,context)=>{
    if(!change.after.exists()) {
      console.log('current Question number do not exists');
      return null;
    }

    let questionTimerRef = change.after.ref.parent.child('questionTimer');
    return questionTimerRef.set(31).then(()=>{
      console.log('questionTimer is set');
    })
    .catch((err)=>{
      console.log('Error while setting questionTimer ',err);
    });
  })
exports.startQuestionTimer = functions.runWith(runtimeOpts).database.ref('/trivia/{gameSessionId}/rounds/{roundValue}/questionTimer/')
  .onCreate(async(snapshot,context)=>{
    let questionTimer = snapshot.val();
    let questionTimerRef = snapshot.ref;
    let pageRef = snapshot.ref.parent.child('page');
    let currentQuestionNumberRef = snapshot.ref.parent.child('currentQuestionNumber');
    let nextQuestionWaitingTimerRef = snapshot.ref.parent.child('nextQuestionWaitingTimer');
    
    return new Promise(async (resolve,reject)=>{
      let interval = setInterval(async()=>{
        //First get the question timer status
        try {
          let snap = await Promise.all( [questionTimerRef.get()]);
          let questionTimerSnap = snap[0];
          if(!questionTimerSnap.exists() || questionTimerSnap.val() == null) {
            console.log('Question timer not exists');
            return resolve();
          }
          questionTimer = questionTimerSnap.val();
          questionTimer = questionTimer - 1;
          if(questionTimer <= 0) {
            if(questionTimer === 0) {
              await questionTimerRef.set(0);
            }
            await nextQuestionWaitingTimerRef.set(5);
            clearInterval(interval);
            return resolve();
          }
          else {
            if(questionTimer) {
              questionTimerRef.set(questionTimer)
            }
          }
        }
        catch(err) {
          console.log('error ',err);
          return resolve();
        }
        
      },1000);
    });
  })

exports.startNextQuestionWaitingTimer = functions.database.ref('/trivia/{gameSessionId}/rounds/{roundValue}/nextQuestionWaitingTimer')
  .onCreate(async(snapshot,context)=>{
    let timerValue = 5;
    let interval;
    let nextQuestionWaitingTimerRef = snapshot.ref;
    let currentQuestionNumberRef = snapshot.ref.parent.child('currentQuestionNumber');
    let questionTimerRef = snapshot.ref.parent.child('questionTimer');
    let currentQuestionNumber,currentQuestionNumberSnap;
    let pageRef = snapshot.ref.parent.child('page');
    let halfTimerRef = snapshot.ref.parent.child('halfTimer');
    let gameSessionId = context.params.gameSessionId;
    let allQuestionsRef = snapshot.ref.parent.child('allQuestions');
    let allQuestions;
    return new Promise(async(resolve,reject)=>{
      interval = setInterval(async()=>{
        timerValue = timerValue - 1;
        try{
          if(timerValue > 0) {
            nextQuestionWaitingTimerRef.set(timerValue);
          }
          else {
            clearInterval(interval);
            await nextQuestionWaitingTimerRef.set(0);
            let snap = await Promise.all([currentQuestionNumberRef.get(),nextQuestionWaitingTimerRef.remove().then(()=>console.log('Waiting timer is removed')),questionTimerRef.remove()]);
            
            // Now change the question number
            currentQuestionNumberSnap = snap[0];
            if(!currentQuestionNumberSnap.exists() || currentQuestionNumberSnap.val() === undefined || currentQuestionNumberSnap.val() === null) {
              console.log('Current Question number not exists');
              return resolve();
            }
            currentQuestionNumber = currentQuestionNumberSnap.val();
            if(currentQuestionNumber === 4) {
              await Promise.all([pageRef.set('HalfTime'),halfTimerRef.set(10)]);
              // clearInterval(interval);
              return resolve();
            }
            else if( currentQuestionNumber === 9) {
              let snap = await Promise.all([allQuestionsRef.get(),pageRef.set('HalfTime')]);
              if(!snap[0].exists() || snap[0].val() === undefined || snap[0].val() === null) {
                console.log('allQuestion not exist in database so unable to update leader board data');
                return resolve();
              }
              allQuestions = snap[0].val();
              let scoreOfUsers = {};
              for(let i = 0; i<=9 ; i++) {
                let currQuestionAnswers = allQuestions[i]['usersAnswers'];
                let correctOption = allQuestions[i]['correctOption'];
                for(const userId in currQuestionAnswers) {
                  let userAnswer = currQuestionAnswers[userId];
                  if(userAnswer === correctOption ) {
                    if(!scoreOfUsers[userId]) {
                      scoreOfUsers = 1;
                    }
                    else {
                      scoreOfUsers += 1;
                    }
                  }
                }
              }
              await updateLeaderBoard({gameSessionId,scoreOfUsers})
              console.log('Leader board is updated');
              // clearInterval(interval);
              return resolve();
            }
            else if(currentQuestionNumber < 9){
              await currentQuestionNumberRef.set(currentQuestionNumber + 1)
              // clearInterval(interval);
              return resolve();
            }
          }
        }
        catch(err) {
          console.log('Some error occur ',err);
          clearInterval(interval);
          return resolve();
        }
      },1000);
    })
  })
exports.setAllQuestions = functions.https.onRequest(async(req, res)=>{
  const {categoryId, gameSessionId, roundValue} = req.body; 
  const db = admin.database();
  let selectedCategoryRef = db.ref(`/trivia/allCategories/${categoryId}`);
   
  let allQuestionsRef = db.ref(`/trivia/${gameSessionId}/rounds/${roundValue}/allQuestions`);
  let categoryNameRef = allQuestionsRef.parent.child('categoryName');
  let currentQuestionRef = allQuestionsRef.parent.child('currentQuestionNumber');
  let pageRef = allQuestionsRef.parent.child('page');
  let selectedCategory,selectedCategorySnap;
  try {
    selectedCategorySnap = await selectedCategoryRef.get();
    if(!selectedCategorySnap.exists()) {
      console.log('selected category does not exist in database');
      res.send({error: ""});
    }
    selectedCategory = selectedCategorySnap.val();
    let categoryQuestions = selectedCategory['categoryQuestions'];
    let categoryName = selectedCategory['categoryName'];
    shuffle(categoryQuestions);
    
    return Promise.all([allQuestionsRef.set(categoryQuestions.slice(0,10)),categoryNameRef.set(categoryName),pageRef.set('Welcome')]).then(()=>{
      console.log('Both are success');
      res.send({});
    })
    .catch((err)=>{
      console.log('error ' ,err);
      res.send({error: ""});
    });
  }
  catch(err) {
    res.send({error: ""});
    console.log('Something went wrong ',err);
  }
})

exports.startHalfTimer = functions.runWith(runtimeOpts).database.ref('/trivia/{gameSessionId}/rounds/{roundValue}/halfTimer/')
  .onCreate(async(snapshot,context)=>{
    let halfTimerRef = snapshot.ref;
    let pageRef = snapshot.ref.parent.child('page');
    let currentQuestionNumberRef = snapshot.ref.parent.child('currentQuestionNumber');
    let interval;
    let timerValue = snapshot.val();

    return new Promise((resolve,reject)=>{

      interval = setInterval(async()=>{
        let halfTimerSnap =  await halfTimerRef.get();
        if(!halfTimerSnap.exists() || halfTimerSnap.val() === undefined) {
          clearInterval(interval);
          resolve();
          return;
        }
        timerValue = halfTimerSnap.val();
        timerValue = timerValue - 1;
        if( timerValue <= 0) {
          await halfTimerRef.set(0);
          Promise.all([pageRef.set('Game'),currentQuestionNumberRef.transaction(count => {if(count === 4)return count + 1;else return count}),halfTimerRef.remove()])
          .then(()=>{
            console.log('page is set to game, question number is incremented and half timer is removed');
            clearInterval(interval);
            resolve();
          })
          .catch((err)=>{
            console.error('error ',err);
            clearInterval(interval);
            resolve();
          });
        }
        else {
          halfTimerRef.set(timerValue);
        }
      },1000);
    })
  })

function shuffle(array) {
  array.sort(() => Math.random() - 0.5);
}

const updateLeaderBoard = ({gameSessionId,scoreOfUsers}) => {
  const roomIdSessionId = gameSessionId;
  console.log('gameSessionId ',roomIdSessionId);
  const sessionId = roomIdSessionId.split("+")[1];
  let scoresArray = [];
  for(const userid in scoreOfUsers) {
    scoresArray.push({
      userid,
      score : scoreOfUsers[userid]*10
    })
  }
  return axios.post(
    `${functions.config().app.url}/v1/api/dapp/extension/${
      functions.config().app.id
    }/leaderboard/save/`,
    {
      session_id: sessionId,
      scores: scoresArray,
    },
    {
      headers: {
        "X-APP-ACCESS-SECRET": `Token ${functions.config().app.secret}`,
      },
    }
  )
    .then(function (response) {
      console.log('Updateleaderboard success response is ',response);
    })
    .catch((error) => {
      console.error('Updateleaderboard error is ',error);
    });
};


