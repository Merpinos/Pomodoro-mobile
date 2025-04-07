import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, StyleSheet, Vibration, TextInput, AppState, Dimensions, ScrollView } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { Audio } from 'expo-av';
import { CircularProgress } from 'react-native-circular-progress';

// Subjects list
const SUBJECTS = ['Physics', 'Chemistry', 'Math', 'Computer Engineering', 'Nepali', 'English'];

const PomodoroScreen = () => {
  // Timer state
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);

  // User-configurable durations
  const [workDuration, setWorkDuration] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);

  // Refs for interval and app state tracking
  const intervalRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef(null);
  const soundRef = useRef(); // Ref to store sound object

  // Countdown to exam
  const targetDate = new Date('2025-04-24T00:00:00');
  const [remainingTime, setRemainingTime] = useState(calculateRemainingTime());

  // Note input
  const [note, setNote] = useState('');

  // Countdown to exam timer setup
  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingTime(calculateRemainingTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate remaining time for countdown
  function calculateRemainingTime() {
    const now = new Date();
    const timeDifference = targetDate - now;

    const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  }

  // Ask for notification permissions on mount
  useEffect(() => {
    (async () => {
      if (Device.isDevice) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Notification permission not granted');
        }
      }
    })();
  }, []);

  // Track app state changes (foreground/background)
  useEffect(() => {
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [isRunning, secondsLeft]);

  // Adjust timer based on background duration
  const handleAppStateChange = (nextAppState) => {
    if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
      backgroundTime.current = Date.now();
    } else if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active' &&
      isRunning
    ) {
      const now = Date.now();
      const diff = Math.floor((now - backgroundTime.current) / 1000);
      setSecondsLeft((prev) => Math.max(prev - diff, 0));
    }
    appState.current = nextAppState;
  };

  // Timer countdown logic
  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => setSecondsLeft((prev) => prev - 1), 1000);
    } else if (isRunning && secondsLeft === 0) {
      handleSessionComplete(); // Handle end of session
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, secondsLeft]);

  // Load alarm sound
  useEffect(() => {
    const loadSound = async () => {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/alarm.mp3')
      );
      soundRef.current = sound;
    };

    loadSound();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Handle when a session or break ends
  const handleSessionComplete = async () => {
    setIsRunning(false);

    // Play alarm sound
    try {
      if (soundRef.current) {
        await soundRef.current.setPositionAsync(0);
        await soundRef.current.playAsync();
        setTimeout(async () => {
          try {
            await soundRef.current.stopAsync();
          } catch (e) {
            console.log('Error stopping sound:', e);
          }
        }, 5000);
      }
    } catch (e) {
      console.log('Error playing sound:', e);
    }

    Vibration.vibrate(1000); // Vibrate on session end

    // Show notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: isBreak ? 'Break Over!' : 'Pomodoro Complete!',
        body: isBreak ? 'Time to focus! 💪' : 'Take a break 🧘‍♂️',
      },
      trigger: null,
    });

    // Save session data if it's a work session
    if (!isBreak) {
      const newSession = {
        timestamp: new Date().toISOString(),
        duration: workDuration * 60,
        subject: selectedSubject,
      };
      const old = JSON.parse(await AsyncStorage.getItem('sessions')) || [];
      await AsyncStorage.setItem('sessions', JSON.stringify([...old, newSession]));
    }

    // Prepare next session
    const nextCycle = isBreak ? cycleCount : cycleCount + 1;
    setCycleCount(nextCycle);
    setIsBreak(!isBreak);

    // Decide duration of next session
    const nextDuration = isBreak
      ? workDuration * 60
      : (nextCycle % 4 === 0 ? longBreak : shortBreak) * 60;
    setSecondsLeft(nextDuration);
    setIsRunning(true); // Auto-start next session
  };

  // Start session
  const startTimer = () => {
    const duration = (isBreak
      ? (cycleCount % 4 === 0 ? longBreak : shortBreak)
      : workDuration) * 60;
    setSecondsLeft(duration);
    setIsRunning(true);
  };

  const pauseTimer = () => setIsRunning(false);
  const resumeTimer = () => setIsRunning(true);

  // Reset timer and cycle count
  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(workDuration * 60);
    setCycleCount(0);
    setIsBreak(false);
  };

  // Format seconds into MM:SS
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const screenWidth = Dimensions.get('window').width;

  return (
    <ScrollView contentContainerStyle={[styles.container]}>
      <Text style={styles.title}>
        {isBreak ? 'Break Time' : 'Focus Time'}
      </Text>
      
      {/* Circular Progress with timer */}
      <View style={styles.progressContainer}>
        <CircularProgress
          size={200}
          width={10}
          fill={(1 - secondsLeft / (workDuration * 60)) * 100}
          tintColor="#00f"
          backgroundColor="#d3d3d3"
          rotation={-90}
        >
          {() => <Text style={styles.timer}>{formatTime(secondsLeft)}</Text>} 
        </CircularProgress>
      </View>

      {/* Timer control buttons */}
      <View style={styles.buttonRow}>
        <Button title={isRunning ? 'Pause' : 'Start'} onPress={isRunning ? pauseTimer : startTimer} />
        <Button title="Resume" onPress={resumeTimer} disabled={isRunning || secondsLeft === 0} />
        <Button title="Reset" onPress={resetTimer} disabled={isRunning || secondsLeft === workDuration * 60} />
      </View>

      {/* Option to skip break */}
      {isBreak && (
        <View style={{ marginTop: 10 }}>
          <Button title="Skip Break" onPress={handleSessionComplete} />
        </View>
      )}

      {/* Countdown to exam */}
      <Text style={[styles.countdown, { fontSize: screenWidth * 0.04 }]}>
        Time remaining until Baisakh 11, 2082:
      </Text>
      <Text style={[styles.countdown, { fontSize: screenWidth * 0.05 }]}>
        {remainingTime.days}d {remainingTime.hours}h {remainingTime.minutes}m {remainingTime.seconds}s
      </Text>

      {/* Subject Picker */}
      <Text style={styles.label}>Subject:</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedSubject}
          onValueChange={(val) => setSelectedSubject(val)}
        >
          {SUBJECTS.map((subj) => (
            <Picker.Item key={subj} label={subj} value={subj} />
          ))}
        </Picker>
      </View>

      {/* Note input */}
      <Text style={styles.label}>Session Note:</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        style={[styles.input, { height: 80 }]}
        multiline
        placeholder="Add a note about this session"
      />

      {/* Settings for durations */}
      <View style={styles.settings}>
        <Text style={styles.label}>Work Duration (min):</Text>
        <TextInput
          keyboardType="numeric"
          value={workDuration.toString()}
          onChangeText={(t) => setWorkDuration(Number(t))}
          style={styles.input}
        />
        <Text style={styles.label}>Short Break (min):</Text>
        <TextInput
          keyboardType="numeric"
          value={shortBreak.toString()}
          onChangeText={(t) => setShortBreak(Number(t))}
          style={styles.input}
        />
        <Text style={styles.label}>Long Break (min):</Text>
        <TextInput
          keyboardType="numeric"
          value={longBreak.toString()}
          onChangeText={(t) => setLongBreak(Number(t))}
          style={styles.input}
        />
        <Text style={styles.cycles}>
          No of cycles completed: {cycleCount} (Long break after {4 - (cycleCount % 4)} more cycle(s))
        </Text>
      </View>
    </ScrollView>
  );
};

// Styling
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 32, textAlign: 'center', marginBottom: 10 },
  timer: { fontSize: 64, fontWeight: 'bold', textAlign: 'center' },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  buttonRow: { flexDirection: 'row', justifyContent: 'center', marginVertical: 20 },
  settings: { marginTop: 30 },
  label: { marginTop: 10, marginBottom: 5 },
  input: { backgroundColor: '#ddd', padding: 8, borderRadius: 5, color: '#000' },
  pickerWrapper: { borderRadius: 5, marginBottom: 20 },
  countdown: { textAlign: 'center', marginTop: 10 },
  cycles: { textAlign: 'center', marginTop: 10, color: '#555' },
});

export default PomodoroScreen;
