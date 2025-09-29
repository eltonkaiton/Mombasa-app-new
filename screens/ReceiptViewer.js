// screens/ReceiptViewer.js
import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';

const ReceiptViewer = ({ route }) => {
  const { url, token } = route.params;

  if (!url || !token) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error: Missing receipt URL or token</Text>
      </View>
    );
  }

  return (
    <WebView
      source={{
        uri: url,
        headers: { Authorization: `Bearer ${token}` },
      }}
      startInLoadingState
      renderLoading={() => (
        <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />
      )}
      onError={(e) => console.log('WebView error:', e.nativeEvent)}
    />
  );
};

export default ReceiptViewer;
