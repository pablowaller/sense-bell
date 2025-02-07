import React, { useEffect, useState } from 'react';
import { View, Button, Text, FlatList, Image, TextInput, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { firebase } from 'firebase/firestore';
import { db } from '../constants/database';
import { collection, onSnapshot, query, where, addDoc, deleteDoc, doc } from 'firebase/firestore';

const VisitorsScreen = ({ route }) => {
  const [visitors, setVisitors] = useState([]);
  const [capturedImage, setCapturedImage] = useState(route?.params?.capturedImage);
  const [visitorName, setVisitorName] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState(null); 
  const [modalVisible, setModalVisible] = useState(false); 

  useEffect(() => {
    const q = query(collection(db, 'visitors'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const visitorsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setVisitors(visitorsData);
    });

    return () => unsubscribe();
  }, []);

  const addVisitorToFirebase = async (imageUri, facialHash, name) => {
    const visitorsRef = collection(db, 'visitors');
    const snapshot = await query(visitorsRef, where("facialHash", "==", facialHash));

    if (snapshot.empty) {
      const newVisitor = {
        name: name || 'Unknown visitor',
        photo: imageUri,
        facialHash: facialHash,
      };
      await addDoc(visitorsRef, newVisitor);
    } else {
      console.log('Visitor already registered');
    }
  };

  const captureFaceHash = (image) => {
    return image + "_hash"; 
  };

  useEffect(() => {
    if (capturedImage && visitorName) {
      const facialHash = captureFaceHash(capturedImage);
      addVisitorToFirebase(capturedImage, facialHash, visitorName);
    }
  }, [capturedImage, visitorName]);

  const handleDelete = async (visitorId) => {
    const visitorRef = doc(db, 'visitors', visitorId);
    await deleteDoc(visitorRef);
    setModalVisible(false); 
  };

  const handleModal = (visitor) => {
    setSelectedVisitor(visitor);
    setModalVisible(true); 
  };

  return (
    <View style={styles.container}>
      {capturedImage && (
        <View>
          <Text>Enter the visitor's name:</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre del visitante"
            value={visitorName}
            onChangeText={setVisitorName}
          />
          <Button
            title="Agregar Visitante"
            onPress={() => {
              if (visitorName) {
                const facialHash = captureFaceHash(capturedImage);
                addVisitorToFirebase(capturedImage, facialHash, visitorName);
              }
            }}
          />
        </View>
      )}

      {visitors.length === 0 ? (
        <Text>No visitors yet.</Text>
      ) : (
        <FlatList
          data={visitors}
          keyExtractor={(item, index) => `${item.name}-${index}`}
          renderItem={({ item }) => (
            <View style={styles.visitorContainer}>
              <Text style={styles.visitorName}>{item.name}</Text>
              <Image
                source={{ uri: item.photo }}
                style={styles.visitorPhoto}
              />
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleModal(item)} 
              >
                <Text style={styles.deleteText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {selectedVisitor && (
        <Modal
          transparent={true}
          visible={modalVisible}
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text>Are you sure you want to delete {selectedVisitor.name}?</Text>
              <Button title="Yes" onPress={() => handleDelete(selectedVisitor.id)} />
              <Button title="No" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingLeft: 10,
  },
  visitorContainer: {
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
  },
  visitorName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  visitorPhoto: {
    width: 100,
    height: 100,
    marginTop: 10,
  },
  deleteButton: {
    marginTop: 10,
    padding: 5,
    backgroundColor: 'red',
    borderRadius: 5,
  },
  deleteText: {
    color: 'white',
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
});

export default VisitorsScreen;