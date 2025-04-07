import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarChart, PieChart } from 'react-native-chart-kit';
import RNPickerSelect from 'react-native-picker-select';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

const screenWidth = Dimensions.get('window').width;
const SUBJECTS = ['Physics', 'Chemistry', 'Math', 'Computer Engineering', 'Nepali', 'English'];

const StatsScreen = () => {
  const [sessions, setSessions] = useState([]);
  const [totals, setTotals] = useState({});
  const [groupedStats, setGroupedStats] = useState({});
  const [filter, setFilter] = useState('weekly');

  useFocusEffect(
    useCallback(() => {
      const loadStats = async () => {
        try {
          const stored = await AsyncStorage.getItem('sessions');
          const data = stored ? JSON.parse(stored) : [];
          setSessions(data);
          computeStats(data);
        } catch (err) {
          console.error('Failed to load sessions:', err);
        }
      };

      loadStats();
    }, [])
  );

  const getWeekKey = (date) => `${date.getFullYear()}-W${Math.ceil((((date - new Date(date.getFullYear(), 0, 1)) / 86400000) + new Date(date.getFullYear(), 0, 1).getDay() + 1) / 7)}`;
  const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

  const computeStats = (data) => {
    const totalMap = {};
    const daily = {};
    const weekly = {};
    const monthly = {};

    data.forEach(({ subject, duration, timestamp }) => {
      const date = new Date(timestamp);
      const dayKey = date.toLocaleDateString();
      const weekKey = getWeekKey(date);
      const monthKey = getMonthKey(date);

      totalMap[subject] = (totalMap[subject] || 0) + duration;

      if (!daily[dayKey]) daily[dayKey] = {};
      daily[dayKey][subject] = (daily[dayKey][subject] || 0) + duration;

      if (!weekly[weekKey]) weekly[weekKey] = {};
      weekly[weekKey][subject] = (weekly[weekKey][subject] || 0) + duration;

      if (!monthly[monthKey]) monthly[monthKey] = {};
      monthly[monthKey][subject] = (monthly[monthKey][subject] || 0) + duration;
    });

    setTotals(totalMap);
    setGroupedStats({ daily, weekly, monthly });
  };

  const getTopSubjectOfWeek = () => {
    const weekData = groupedStats['weekly'];
    if (!weekData) return null;
    const latestWeek = Object.keys(weekData).sort().pop();
    const subjectDurations = weekData[latestWeek];
    if (!subjectDurations) return null;

    const topSubject = Object.entries(subjectDurations).reduce((top, curr) =>
      curr[1] > top[1] ? curr : top
    );

    return {
      subject: topSubject[0],
      duration: Math.round(topSubject[1] / 60),
    };
  };

  const formatMinutes = (seconds) => Math.round(seconds / 60);

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
    strokeWidth: 2,
    decimalPlaces: 0,
  };

  const createBarData = (data) => ({
    labels: SUBJECTS,
    datasets: [{ data: SUBJECTS.map((s) => formatMinutes(data[s] || 0)) }],
  });

  const createPieData = (data) =>
    SUBJECTS.map((subject) => ({
      name: subject,
      duration: formatMinutes(data[subject] || 0),
      color: `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`,
      legendFontColor: '#000',
      legendFontSize: 12,
    })).filter((d) => d.duration > 0);

  const currentStats = groupedStats[filter];
  const latestKey = currentStats ? Object.keys(currentStats).sort().pop() : null;
  const currentData = latestKey ? currentStats[latestKey] : {};

  return (
    <ScrollView style={[styles.container]}>
      <Text style={styles.header}>📊 Study Stats</Text>

      <RNPickerSelect
        onValueChange={(val) => setFilter(val)}
        value={filter}
        style={{
          inputIOS: {
            padding: 10,
            borderWidth: 1,
            borderColor: '#ccc',
            marginBottom: 15,
            color: '#000',
            backgroundColor: '#eee',
          },
        }}
        items={[
          { label: 'Daily', value: 'daily' },
          { label: 'Weekly', value: 'weekly' },
          { label: 'Monthly', value: 'monthly' },
        ]}
      />

      {/* Pie Chart */}
      <Text style={styles.sectionTitle}>📌 {filter.charAt(0).toUpperCase() + filter.slice(1)} Pie Chart</Text>
      <PieChart
        data={createPieData(currentData)}
        width={screenWidth - 16}
        height={220}
        accessor="duration"
        backgroundColor="transparent"
        paddingLeft="8"
        chartConfig={chartConfig}
        style={{ marginVertical: 10 }}
      />

      {/* Bar Chart */}
      <Text style={styles.sectionTitle}>📊 Bar Chart</Text>
      <BarChart
        data={createBarData(currentData)}
        width={screenWidth - 16}
        height={220}
        yAxisSuffix="m"
        chartConfig={chartConfig}
        verticalLabelRotation={30}
        style={{ marginBottom: 30 }}
      />

      {/* Session Counts */}
      <Text style={styles.sectionTitle}>
        🧮 Session Count per Subject
      </Text>
      <View style={{ marginBottom: 40 }}>
        {SUBJECTS.map((subj) => {
          const count = sessions.filter((s) => s.subject === subj).length;
          return (
            <Text key={subj} style={{ fontSize: 16, color: '#333', paddingVertical: 2 }}>
              • {subj}: {count} session{subj === 1 ? '' : 's'}
            </Text>
          );
        })}
      </View>

      {/* Average Session Length */}
      <Text style={styles.sectionTitle}>
        ⏱️ Average Session Duration (per subject)
      </Text>
      <View style={{ marginBottom: 40 }}>
        {SUBJECTS.map((subj) => {
          const subjectSessions = sessions.filter((s) => s.subject === subj);
          const totalDuration = subjectSessions.reduce((sum, s) => sum + s.duration, 0);
          const average = subjectSessions.length ? totalDuration / subjectSessions.length : 0;
          return (
            <Text key={subj} style={{ fontSize: 16, color: '#333', paddingVertical: 2 }}>
              • {subj}: {Math.round(average / 60)} min
            </Text>
          );
        })}
      </View>

    </ScrollView>
  );
};

export default StatsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  header: {
    fontSize: 28,
    marginVertical: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    marginTop: 10,
    marginBottom: 6,
  },
});
