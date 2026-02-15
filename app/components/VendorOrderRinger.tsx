import React, { useState, useEffect } from 'react';
import { View, Text, AppState, StyleSheet } from 'react-native';
import { firestore } from '../firebase';
import Sound from 'react-native-sound';

// IMPORTANT: Place a 'ringing.mp3' file in your 'assets' folder.
const ringtone = 'ringing.mp3';

const VendorOrderRinger = ({ vendorId }) => {
  const [sound, setSound] = useState(null);
  const [isRinging, setIsRinging] = useState(false);
  const [statusText, setStatusText] = useState('Initializing...');

  // --- Step 1: Load the sound file ---
  useEffect(() => {
    Sound.setCategory('Playback');

    const ringtoneSound = new Sound(ringtone, Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('Failed to load the sound', error);
        setStatusText('Error loading sound file.');
        return;
      }
      ringtoneSound.setNumberOfLoops(-1); // Loop indefinitely
      setSound(ringtoneSound);
    });

    return () => {
      if (ringtoneSound) {
        ringtoneSound.release();
      }
    };
  }, []);

  // --- Step 2: Listen for new orders in real-time ---
  useEffect(() => {
    if (!vendorId || !sound) {
      return;
    }

    setStatusText('Listening for new orders...');

    const unsubscribe = firestore
      .collection('orders')
      .where('vendorId', '==', vendorId)
      .where('status', '==', 'pending')
      .onSnapshot(querySnapshot => {
        
        const hasPendingOrders = !querySnapshot.empty;

        if (hasPendingOrders && !isRinging) {
          console.log('New pending order! Starting ringtone...');
          setStatusText('New order received! Answering...');
          sound.play(success => {
            if (success) {
              console.log('Ringtone is playing.');
              setIsRinging(true);
            } else {
              console.log('Ringtone playback failed.');
              setStatusText('Error playing sound.');
            }
          });
        }
        
        if (!hasPendingOrders && isRinging) {
          console.log('All pending orders handled. Stopping ringtone.');
          sound.stop();
          setIsRinging(false);
          setStatusText('Listening for new orders...');
        }
      }, error => {
        console.error("Firestore listener error:", error);
        setStatusText('Error connecting to database.');
      });

    return () => unsubscribe();
  }, [vendorId, sound, isRinging]);
  

  return (
    <View style={styles.container}>
      <Text style={isRinging ? styles.ringingText : styles.listeningText}>
        {statusText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd'
    },
    listeningText: {
        fontSize: 18,
        color: 'green',
        fontWeight: 'bold',
    },
    ringingText: {
        fontSize: 18,
        color: 'red',
        fontWeight: 'bold',
    }
});


export default VendorOrderRinger;
