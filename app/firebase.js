import firebase from '@react-native-firebase/app';
import '@react-native-firebase/firestore';
import { firebaseConfig } from '../firebaseConfig';

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const firestore = firebase.firestore();
export default firebase;
