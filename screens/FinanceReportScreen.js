import React, { useEffect, useState } from 'react';
import {
  View, ActivityIndicator, Alert, StyleSheet, TouchableOpacity, Text
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { downloadFinanceReport } from '../services/financeApi';

const FinanceReportScreen = () => {
  const [base64Pdf, setBase64Pdf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadReport = async () => {
      try {
        const base64 = await downloadFinanceReport();
        setBase64Pdf(base64);
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to load finance report');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, []);

  const handleDownload = async () => {
    try {
      setSaving(true);

      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please allow access to media library');
        return;
      }

      const fileName = `finance_report_${Date.now()}.pdf`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, base64Pdf, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const asset = await MediaLibrary.createAssetAsync(fileUri);
      const album = await MediaLibrary.getAlbumAsync('Download');
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync('Download', asset, false);
      }

      Alert.alert('Success', 'Report saved to Downloads');
    } catch (err) {
      console.error('Save error:', err);
      Alert.alert('Error', 'Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0077b6" />
      </View>
    );
  }

  if (!base64Pdf) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'red' }}>Could not display report</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <WebView
        originWhitelist={['*']}
        style={{ flex: 1 }}
        source={{ uri: `data:application/pdf;base64,${base64Pdf}` }}
      />

      <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload} disabled={saving}>
        <Text style={styles.downloadText}>
          {saving ? 'Saving...' : 'Download Report'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  downloadBtn: {
    backgroundColor: '#0077b6',
    padding: 16,
    alignItems: 'center',
  },
  downloadText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default FinanceReportScreen;
