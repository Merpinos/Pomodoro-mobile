import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SubjectPicker from '../components/SubjectPicker';

export default function TodoScreen() {
  const [selectedSubject, setSelectedSubject] = useState('Physics');
  const [taskText, setTaskText] = useState('');
  const [tasks, setTasks] = useState({});
  const [completedTasks, setCompletedTasks] = useState({});

  useEffect(() => {
    const loadData = async () => {
      const storedTasks = JSON.parse(await AsyncStorage.getItem('todoTasks')) || {};
      const storedCompleted = JSON.parse(await AsyncStorage.getItem('completedTodoTasks')) || {};
      setTasks(storedTasks);
      setCompletedTasks(storedCompleted);
    };
    loadData();
  }, []);

  const saveData = async (updatedTasks, updatedCompleted) => {
    await AsyncStorage.setItem('todoTasks', JSON.stringify(updatedTasks));
    await AsyncStorage.setItem('completedTodoTasks', JSON.stringify(updatedCompleted));
  };

  const addTask = () => {
    if (!taskText.trim()) return;
    const newTask = {
      id: Date.now(),
      text: taskText,
      createdAt: new Date().toLocaleString(),
    };
    const updated = {
      ...tasks,
      [selectedSubject]: [...(tasks[selectedSubject] || []), newTask],
    };
    setTasks(updated);
    setTaskText('');
    saveData(updated, completedTasks);
    Keyboard.dismiss();
  };

  const deleteTask = (taskId) => {
    const updated = {
      ...tasks,
      [selectedSubject]: tasks[selectedSubject].filter((t) => t.id !== taskId),
    };
    setTasks(updated);
    saveData(updated, completedTasks);
  };

  const markComplete = (taskId) => {
    const taskToComplete = tasks[selectedSubject].find((t) => t.id === taskId);
    const updatedTasks = {
      ...tasks,
      [selectedSubject]: tasks[selectedSubject].filter((t) => t.id !== taskId),
    };
    const updatedCompleted = {
      ...completedTasks,
      [selectedSubject]: [...(completedTasks[selectedSubject] || []), taskToComplete],
    };
    setTasks(updatedTasks);
    setCompletedTasks(updatedCompleted);
    saveData(updatedTasks, updatedCompleted);
  };

  const clearCompleted = () => {
    const updatedCompleted = {
      ...completedTasks,
      [selectedSubject]: [],
    };
    setCompletedTasks(updatedCompleted);
    saveData(tasks, updatedCompleted);
  };

  const renderTaskItem = ({ item }) => (
    <View style={styles.taskItem}>
      <View>
        <Text style={styles.taskText}>{item.text}</Text>
        <Text style={styles.timestamp}>{item.createdAt}</Text>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity onPress={() => markComplete(item.id)} style={styles.completeBtn}>
          <Text style={styles.btnText}>✔️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteTask(item.id)} style={styles.deleteBtn}>
          <Text style={styles.btnText}>❌</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCompletedItem = ({ item }) => (
    <View style={styles.completedItem}>
      <Text style={styles.completedText}>✅ {item.text}</Text>
      <Text style={styles.timestamp}>{item.createdAt}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <SubjectPicker selected={selectedSubject} setSelected={setSelectedSubject} />

      <View style={styles.inputRow}>
        <TextInput
          placeholder="Enter task..."
          style={styles.input}
          value={taskText}
          onChangeText={setTaskText}
        />
        <Button title="Add" onPress={addTask} />
      </View>

      <Text style={styles.sectionTitle}>Pending Tasks</Text>
      <FlatList
        data={tasks[selectedSubject] || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTaskItem}
        ListEmptyComponent={<Text style={styles.empty}>No tasks for {selectedSubject}</Text>}
      />

      <View style={styles.completedHeader}>
        <Text style={styles.sectionTitle}>Completed Tasks</Text>
        <TouchableOpacity onPress={clearCompleted}>
          <Text style={styles.clearBtn}>Clear</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={completedTasks[selectedSubject] || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCompletedItem}
        ListEmptyComponent={<Text style={styles.empty}>No completed tasks yet</Text>}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  input: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 8,
  },
  taskItem: {
    backgroundColor: '#f2f2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taskText: { fontSize: 16, fontWeight:'bold' },
  timestamp: { fontSize: 12, color: '#777' },
  buttonRow: { flexDirection: 'row', gap: 10 },
  completeBtn: { paddingHorizontal: 8 },
  deleteBtn: { paddingHorizontal: 8 },
  btnText: { fontSize: 18 },
  completedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  clearBtn: { color: 'red', fontSize: 14 },
  completedItem: {
    backgroundColor: '#d7f7d4',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  completedText: { fontSize: 16 },
  empty: { textAlign: 'center', marginVertical: 20, color: '#888' },
});
