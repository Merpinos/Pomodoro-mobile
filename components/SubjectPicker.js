import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function SubjectPicker({ selected, setSelected }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Subject:</Text>
      <Picker
        selectedValue={selected}
        style={styles.picker}
        onValueChange={setSelected}
      >
        <Picker.Item label="Physics" value="Physics" />
        <Picker.Item label="Chemistry" value="Chemistry" />
        <Picker.Item label="Math" value="Math" />
        <Picker.Item label="Computer " value="Computer " />
        <Picker.Item label="English " value="English " />
        <Picker.Item label="Nepali" value="Nepali" />
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 5 },
  picker: { height: 50, width: '100%' }
});
