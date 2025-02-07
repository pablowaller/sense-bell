import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

const [isLoading, setIsLoading] = useState(false);

export const LoadingSpinner = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color="#0000ff" />
  </View>
); 