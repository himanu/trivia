import firebase from "firebase/app";
import "firebase/database";
import 'firebase/functions';
import { getGameSessionId, getParams } from "./utils";

const firebaseConfig = {
	apiKey: process.env.API_KEY,
	authDomain: process.env.AUTH_DOMAIN,
	databaseURL: process.env.DATABASE_URL,
	projectId: process.env.PROJECT_ID,
	storageBucket: process.env.STORAGE_BUCKET,
	messagingSenderId: process.env.MESSAGING_SENDER_ID,
	appId: process.env.APP_ID,
};

  // Initialize Firebase
firebase.initializeApp(firebaseConfig);
if(process.env.EMULATE) {
    var firebaseEmulators = {
      "database": {
        "host": "localhost",
        "port": 9000
      },
      "functions": {
        "host": "localhost",
        "port": 5001
      }
    };
  if (firebaseEmulators) {
      console.log("Automatically connecting Firebase SDKs to running emulators:");
      Object.keys(firebaseEmulators).forEach(function(key) {
      console.log('\t' + key + ': http://' +  firebaseEmulators[key].host + ':' + firebaseEmulators[key].port );
      });
      if (firebaseEmulators.database && typeof firebase.database === 'function') {
      firebase.database().useEmulator(firebaseEmulators.database.host, firebaseEmulators.database.port);
      }
      if (firebaseEmulators.firestore && typeof firebase.firestore === 'function') {
      firebase.firestore().useEmulator(firebaseEmulators.firestore.host, firebaseEmulators.firestore.port);
      }
      if (firebaseEmulators.functions && typeof firebase.functions === 'function') {
      firebase.functions().useEmulator(firebaseEmulators.functions.host, firebaseEmulators.functions.port);
      }
      if (firebaseEmulators.auth && typeof firebase.auth === 'function') {
      firebase.auth().useEmulator('http://' + firebaseEmulators.auth.host + ':' + firebaseEmulators.auth.port);
      }
  } else {
      console.log("To automatically connect the Firebase SDKs to running emulators, replace '/__/firebase/init.js' with '/__/firebase/init.js?useEmulator=true' in your index.html");
  }
}


let roundValue = 1;
function getRoundValue() {
    return roundValue;
}

export const dbRoot = firebase.database().ref('trivia');
export const dbAllCategories = dbRoot.child('allCategories');
export const dbAllCategoriesName = dbRoot.child('allCategoriesName');
export const dbGameSession = dbRoot.child(getGameSessionId());
export const dbGameSessionRoundValue = dbGameSession.child("roundValue");
export const dbGameSessionRounds = dbGameSession.child("rounds");
export const dbUsers = dbGameSession.child('users');
export const dbUser = dbUsers.child(getParams('userId'));
export const dbHost = dbGameSession.child('host');
export const dbScoreOfUsers = dbGameSession.child('scoreOfUsers');
export const dbScoreOfUser = dbScoreOfUsers.child(getParams('userId'));


export const dbGameSessionRound = ()=> dbGameSessionRounds.child(getRoundValue());
export const dbPage = ()=> dbGameSessionRound().child('page');
export const dbTimer = ()=> dbGameSessionRound().child('timer');
export const dbHalfTimer = ()=> dbGameSessionRound().child('halfTimer');
export const dbCurrentQuestionNumber = ()=> dbGameSessionRound().child('currentQuestionNumber');
export const dbAllQuestion = ()=> dbGameSessionRound().child('allQuestions');
export const dbCategoryName = ()=> dbGameSessionRound().child('categoryName');
export const dbQuestionTimer = ()=> dbGameSessionRound().child('questionTimer');
export const dbHostAction = ()=> dbGameSessionRound().child('hostAction');

export function listenFirebaseKey(key,callback) {
  roundTimeValuePromise.then(()=>{
      callback(key());
  })
}
const roundTimeValuePromise = new Promise((resolve,reject)=>{
  dbGameSessionRoundValue.once('value',(snap)=>{
      if(!snap.exists()) {
          roundValue = 1;
      }
      else {
          roundValue = snap.val();
      }
      resolve();
  })
})

dbGameSessionRoundValue.on("value", (snap) => {
  if(!snap.exists()) {
      dbGameSessionRoundValue.set(1);
      roundValue = 1;
      return ;
  }
  roundValue = snap.val();
})
// console.log(allCategoriesObject[0]['categoryQuestions'].length);
// dbAllCategories.set(allCategoriesObject); 
// dbAllCategoriesName.set(categoriesNameArray);
var connectedRef = firebase.database().ref('.info/connected');
connectedRef.on('value', (snap) => {
  if (snap.val() === true) {

    dbUser.update({
      online : true,
      isOnline : true
    });

    dbUser.onDisconnect().update({
        online : firebase.database.ServerValue.TIMESTAMP
    });
  }
});
// dbScoreOfUser.once('value',(snap)=>{
//   if(!snap.exists()) {
//       dbScoreOfUser.set(0);
//       return;
//   }
// })
dbUser.update({
  id: getParams('userId'),
  userName: getParams('userName'),
  profilePicture: getParams('userProfilePicture')
}).then(()=>{
  console.log('User data is updated');
}).catch(()=>{
  console.log('Some error occured');
});