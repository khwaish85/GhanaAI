import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Platform,
  ScrollView,
  TextInput,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'react-native-image-picker';
import SurenderChatbot from '../components/SurenderChatbot';
import LinearGradient from 'react-native-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');

// --- MOCK DATA FOR MARKET PRICES ---
interface CropPrice {
  id: string;
  name: string;
  pricePerKg: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
  emoji: string;
  mandi: string;
}

const mockMarketPrices: CropPrice[] = [
  { id: 'rice', name: 'Basmati Rice', pricePerKg: 65, unit: 'Kg', trend: 'up', lastUpdated: '1 hour ago', emoji: '🍚', mandi: 'Karnal' },
  { id: 'wheat', name: 'Wheat', pricePerKg: 25, unit: 'Kg', trend: 'stable', lastUpdated: '2 hours ago', emoji: '🌾', mandi: 'Chandigarh' },
  { id: 'potato', name: 'Potato', pricePerKg: 20, unit: 'Kg', trend: 'down', lastUpdated: '30 mins ago', emoji: '🥔', mandi: 'Agra' },
  { id: 'onion', name: 'Onion', pricePerKg: 30, unit: 'Kg', trend: 'up', lastUpdated: '1 hour ago', emoji: '🧅', mandi: 'Nashik' },
  { id: 'tomato', name: 'Tomato', pricePerKg: 28, unit: 'Kg', trend: 'down', lastUpdated: '4 hours ago', emoji: '🍅', mandi: 'Bengaluru' },
  { id: 'maize', name: 'Maize', pricePerKg: 22, unit: 'Kg', trend: 'stable', lastUpdated: '5 hours ago', emoji: '🌽', mandi: 'Lucknow' },
  { id: 'cotton', name: 'Cotton', pricePerKg: 70, unit: 'Kg', trend: 'up', lastUpdated: '6 hours ago', emoji: '☁️', mandi: 'Ahmedabad' },
];
// --- END MOCK DATA FOR MARKET PRICES ---

const CropPriceCard: React.FC<{ crop: CropPrice }> = ({ crop }) => {
  const getTrendIcon = (trend: CropPrice['trend']) => {
    if (trend === 'up') return '▲';
    if (trend === 'down') return '▼';
    return '▬';
  };

  const getTrendColor = (trend: CropPrice['trend']) => {
    if (trend === 'up') return '#28A745';
    if (trend === 'down') return '#DC3545';
    return '#FFC107';
  };

  return (
    <LinearGradient
      colors={['#f8f8f8', '#ffffff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cropPriceCard}
    >
      <View style={styles.cropPriceCardContent}>
        <Text style={styles.cropPriceEmoji}>{crop.emoji}</Text>
        <View style={styles.cropInfo}>
          <Text style={styles.cropPriceName} numberOfLines={1} ellipsizeMode="tail">{crop.name}</Text>
          <Text style={styles.cropPriceValue}>₹{crop.pricePerKg}/{crop.unit}</Text>
          <View style={styles.cropPriceTrend}>
            <Text style={[styles.cropPriceTrendIcon, { color: getTrendColor(crop.trend) }]}>
              {getTrendIcon(crop.trend)}
            </Text>
            <Text style={[styles.cropPriceTrendText, { color: getTrendColor(crop.trend) }]}>
              {crop.trend.charAt(0).toUpperCase() + crop.trend.slice(1)}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.cropPriceMandi}>Mandi: {crop.mandi}</Text>
      <Text style={styles.cropPriceUpdated}>Updated: {crop.lastUpdated}</Text>
    </LinearGradient>
  );
};


const Dashboard = () => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [moisture, setMoisture] = useState('');
  const [temperature, setTemperature] = useState('');
  const [ph, setPh] = useState('');
  const [nitrogen, setNitrogen] = useState('');
  const [recommendations, setRecommendations] = useState<string | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [marketPrices, setMarketPrices] = useState<CropPrice[]>([]);
  const [loadingMarketPrices, setLoadingMarketPrices] = useState(false);

  // --- AI Analysis States ---
  // Changed default to null, so user must select explicitly or you set a logical default for your use case
  const [selectedCropForAnalysis, setSelectedCropForAnalysis] = useState<string | null>('maize'); 
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null);

  // --- Soil Recommendation Crop State ---
  const [selectedSoilCrop, setSelectedSoilCrop] = useState<string | null>('general');

  const soilRecommendationCrops = [
    { label: 'General', value: 'general' },
    { label: 'Maize', value: 'maize' },
    { label: 'Tomato', value: 'tomato' },
    { label: 'Cashew', value: 'cashew' },
    { label: 'Cassava', value: 'cassava' },
  ];

  // --- Date Input State ---
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // --- Auto-Scrolling Refs and State ---
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollOffset = useRef(0);
  const contentWidth = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isScrolling = useRef(false);

  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // List of crops for AI analysis dropdown (kept separate for clarity)
  const cropsForAnalysis = [
    { label: 'Select Crop', value: '' }, // Added a default "Select Crop" option
    { label: 'Maize', value: 'maize' },
    { label: 'Tomato', value: 'tomato' },
    { label: 'Cashew', value: 'cashew' },
    { label: 'Cassava', value: 'cassava' },
  ];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Simulate fetching market prices
    setLoadingMarketPrices(true);
    setTimeout(() => {
      setMarketPrices(mockMarketPrices);
      setLoadingMarketPrices(false);
      startAutoScroll();
    }, 1000);

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startAutoScroll = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    const cardWidthWithMargin = (width * 0.38) + (8 * 2);
    
    intervalRef.current = setInterval(() => {
      if (!isScrolling.current && scrollViewRef.current && contentWidth.current > 0) {
        const newOffset = scrollOffset.current + cardWidthWithMargin;
        const maxOffset = contentWidth.current - width + (20 * 2);

        if (newOffset >= maxOffset) {
          scrollViewRef.current.scrollTo({ x: 0, animated: true });
          scrollOffset.current = 0;
        } else {
          scrollViewRef.current.scrollTo({ x: newOffset, animated: true });
          scrollOffset.current = newOffset;
        }
      }
    }, 3000);
  };

  const pauseAutoScroll = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleScrollBeginDrag = () => {
    isScrolling.current = true;
    pauseAutoScroll();
  };

  const handleScrollEndDrag = () => {
    isScrolling.current = false;
    startAutoScroll();
  };

  const handleContentSizeChange = (w: number, h: number) => {
    contentWidth.current = w;
  };

  // --- Date Picker Handlers ---
  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const formatDate = (date: Date) => {
    // Current year to avoid future dates by default if not changed by user
    const currentYear = new Date().getFullYear();
    if (date.getFullYear() > currentYear) {
      date.setFullYear(currentYear);
    }
    return date.toLocaleDateString('en-GB'); // Format as DD/MM/YYYY
  };

  const handleImagePick = (type: 'camera' | 'gallery') => {
    const options = { mediaType: 'photo' as const, includeBase64: false };
    const picker = type === 'camera'
      ? ImagePicker.launchCamera
      : ImagePicker.launchImageLibrary;

    picker(options, (response) => {
      if (response?.didCancel) {
        // User cancelled
      } else if (response?.errorMessage) {
        Alert.alert('Image Pick Error', `Failed to pick image: ${response.errorMessage}`);
      } else if (response?.assets && response.assets.length > 0) {
        setImageUri(response.assets[0].uri || null);
        setAiAnalysisResult(null); // Clear previous analysis result
        setAiAnalysisError(null); // Clear previous analysis error
      }
    });
  };

  const getParameterStatus = (value: string, type: 'moisture' | 'temperature' | 'ph' | 'nitrogen') => {
    if (!value) return { status: 'unknown', color: '#B0BEC5', text: 'Enter value' };
    const numValue = parseFloat(value);
    switch (type) {
      case 'moisture':
        if (isNaN(numValue)) return { status: 'invalid', color: '#B0BEC5', text: 'Invalid value' };
        if (numValue < 20) return { status: 'low', color: '#F44336', text: 'Too Dry' };
        if (numValue > 80) return { status: 'high', color: '#FF9800', text: 'Too Wet' };
        return { status: 'optimal', color: '#4CAF50', text: 'Optimal' };
      case 'temperature':
        if (isNaN(numValue)) return { status: 'invalid', color: '#B0BEC5', text: 'Invalid value' };
        if (numValue < 15) return { status: 'low', color: '#2196F3', text: 'Too Cold' };
        if (numValue > 35) return { status: 'high', color: '#F44336', text: 'Too Hot' };
        return { status: 'optimal', color: '#4CAF50', text: 'Good' };
      case 'ph':
        if (isNaN(numValue)) return { status: 'invalid', color: '#B0BEC5', text: 'Invalid value' };
        if (numValue < 6.0) return { status: 'low', color: '#FF9800', text: 'Acidic' };
        if (numValue > 7.5) return { status: 'high', color: '#9C27B0', text: 'Alkaline' };
        return { status: 'optimal', color: '#4CAF50', text: 'Balanced' };
      case 'nitrogen':
        if (isNaN(numValue)) return { status: 'invalid', color: '#B0BEC5', text: 'Invalid value' };
        if (numValue < 20) return { status: 'low', color: '#F44336', text: 'Low' };
        if (numValue > 40) return { status: 'high', color: '#FF9800', text: 'High' };
        return { status: 'optimal', color: '#4CAF50', text: 'Good' };
      default:
        return { status: 'unknown', color: '#B0BEC5', text: 'Enter value' };
    }
  };

  const getSoilRecommendations = async () => {
    setLoadingRecommendations(true);
    setRecommendationError(null);
    setRecommendations(null);

    const cropContext = selectedSoilCrop && selectedSoilCrop !== 'general' ? ` for ${selectedSoilCrop.charAt(0).toUpperCase() + selectedSoilCrop.slice(1)}` : '';

    const prompt = `Based on the following soil parameters, provide concise agricultural recommendations${cropContext} for optimal crop growth. 
                     Be specific and actionable, suggesting adjustments if a parameter is not optimal.
                     Moisture: ${moisture ? moisture + '%' : 'unknown'}, Temperature: ${temperature ? temperature + '°C' : 'unknown'}, pH: ${ph || 'unknown'}, Nitrogen: ${nitrogen ? nitrogen + ' PPM' : 'unknown'}.
                     If any parameter is missing or invalid, assume it's "unknown" and provide general advice.`;

    try {
      let chatHistory = [];
      chatHistory.push({ role: "user", parts: [{ text: prompt }] });
      const payload = { contents: chatHistory };
      // IMPORTANT: Replace with your actual API key
      const apiKey = "YOUR_GEMINI_API_KEY_HERE"; 
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        setRecommendations(text);
      } else {
        setRecommendationError('Failed to get recommendations. Check API key or response format.');
      }
    } catch (error: any) {
      console.error("AI Recommendation error:", error);
      setRecommendationError(`An error occurred: ${error.message || 'Please check your network or try again later.'}`);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const sendImageForAnalysis = async () => {
    if (!imageUri) {
      setAiAnalysisError('Please select an image first.');
      Alert.alert('No Image', 'Please select an image from your gallery or camera to perform analysis.');
      return;
    }
    if (!selectedCropForAnalysis || selectedCropForAnalysis === '') {
      setAiAnalysisError('Please select a crop type for analysis.');
      Alert.alert('No Crop Selected', 'Please choose the crop type from the dropdown to analyze the image.');
      return;
    }

    setAnalyzingImage(true);
    setAiAnalysisResult(null); // Clear previous results
    setAiAnalysisError(null); // Clear previous errors

    // IMPORTANT: Replace with your Flask API's actual IP address and port
    // Ensure your Flask app is running and accessible from your device/emulator's network.
    const flaskApiUrl = `http://172.20.182.62:5001/predict/${selectedCropForAnalysis}`; 

    const formData = new FormData();

    const fileExtension = imageUri.split('.').pop();
    const fileName = `photo.${fileExtension}`;
    const fileType = `image/${fileExtension}`; // e.g., 'image/jpeg', 'image/png'

    formData.append('file', {
      uri: imageUri,
      name: fileName,
      type: fileType,
    } as any);

    // Optional: Add selected date to formData, though your app.py doesn't currently use it for prediction logic.
    // formData.append('date', selectedDate.toISOString());

    try {
      const response = await fetch(flaskApiUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data', // This header is crucial for FormData
        },
      });

      if (!response.ok) {
        const errorText = await response.text(); // Get raw text to help debug API errors
        let errorMessage = `HTTP error! Status: ${response.status}`;
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorMessage;
        } catch (parseError) {
            errorMessage += ` - Response: ${errorText.substring(0, 100)}...`; // Show part of non-JSON response
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Check if prediction and confidence are in the result
      if (result.prediction && typeof result.confidence === 'number') {
        setAiAnalysisResult(`Prediction for ${result.crop.toUpperCase()}: ${result.prediction}. Confidence: ${(result.confidence * 100).toFixed(2)}%`);
      } else {
        setAiAnalysisError('Unexpected response format from AI backend.');
        console.warn('AI Backend returned unexpected data:', result);
      }
      
    } catch (error: any) {
      console.error('AI Analysis network/API error:', error);
      setAiAnalysisError(`Analysis failed: ${error.message || 'Network error or server unreachable.'} Make sure Flask server is running at ${flaskApiUrl} and accessible.`);
      Alert.alert('Analysis Failed', `Could not connect to the AI service or an error occurred: ${error.message || 'Unknown error'}`);
    } finally {
      setAnalyzingImage(false);
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#29ca9f', '#fbe2ba']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.6 }}
        style={styles.fullScreenGradient}
      />

      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {/* Header Section */}
          <Animated.View
              style={[
                styles.headerContainer,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <LinearGradient
                colors={['#227263', '#2e8f80']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.farmCard}
              >
                <View style={styles.row}>
                  <Text style={styles.headerText}>🌾 Farm AI Dashboard ⛅</Text>
                </View>
              </LinearGradient>
            </Animated.View>

          {/* Market Price Section */}
          <Animated.View
            style={[
              styles.marketPriceSection,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.marketPriceHeader}>
              <Text style={styles.sectionTitle}>💰 Market Prices</Text>
              <TouchableOpacity
                onPress={() => {
                  console.log('Navigate to full Market Price Screen');
                }}
                style={styles.viewAllPricesButton}
              >
                {/* <Text style={styles.viewAllPricesText}>View All</Text> */}
              </TouchableOpacity>
            </View>
            {loadingMarketPrices ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Loading market prices...</Text>
              </View>
            ) : (
              <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.marketPriceScroll}
                onContentSizeChange={handleContentSizeChange}
                onScroll={e => { scrollOffset.current = e.nativeEvent.contentOffset.x; }}
                scrollEventThrottle={16}
                onScrollBeginDrag={handleScrollBeginDrag}
                onScrollEndDrag={handleScrollEndDrag}
              >
                {mockMarketPrices.map(crop => (
                  <CropPriceCard key={crop.id} crop={crop} />
                ))}
              </ScrollView>
            )}
          </Animated.View>

          {/* Upload Card */}
          <Animated.View
            style={[
              styles.uploadCard,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            <Image
              source={require('../assets/cloud.png')}
              style={styles.iconImageLarge}
            />
            <Text style={styles.uploadText}>Select Image</Text>
            <Text style={styles.uploadHint}>Choose from gallery or use camera for AI analysis</Text>

            {/* Date Input for Image Upload */}
            <TouchableOpacity onPress={showDatepicker} style={styles.dateInputContainer}>
              <Text style={styles.dateInputText}>Date: {formatDate(selectedDate)}</Text>
              {Platform.OS === 'android' && (
                <Text style={styles.dateInputHint}>Tap to change</Text>
              )}
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={selectedDate}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.optionButton1}
                onPress={() => handleImagePick('gallery')}
                activeOpacity={0.7}
              >
                <Image
                  source={require('../assets/gallery.png')}
                  style={styles.iconImageRegular}
                />
                <Text style={styles.optionText1}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleImagePick('camera')}
                activeOpacity={0.7}
              >
                <Image
                  source={require('../assets/camera.png')}
                  style={styles.iconImageRegular}
                />
                <Text style={styles.optionText}>Camera</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Image Preview */}
          {imageUri && (
            <Animated.View
              style={[
                styles.imagePreviewContainer,
                { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
              ]}
            >
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  setImageUri(null);
                  setAiAnalysisResult(null);
                  setAiAnalysisError(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.removeImageEmoji}>❌</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

<View style={styles.soilCropButtonsContainer}>
              {soilRecommendationCrops.map((crop) => (
                <TouchableOpacity
                  key={crop.value}
                  style={[
                    styles.soilCropButton,
                    selectedSoilCrop === crop.value && styles.soilCropButtonSelected,
                  ]}
                  onPress={() => setSelectedSoilCrop(crop.value)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.soilCropButtonText,
                      selectedSoilCrop === crop.value && styles.soilCropButtonTextSelected,
                    ]}
                  >
                    {crop.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

          {/* Bottom Cards - AI Analysis (Modified) */}
          <Animated.View
            style={[
              styles.bottomCards,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <TouchableOpacity
              style={[styles.aiCard, (!imageUri || analyzingImage || !selectedCropForAnalysis || selectedCropForAnalysis === '') && styles.disabledButton]}
              activeOpacity={0.8}
              onPress={sendImageForAnalysis}
              disabled={!imageUri || analyzingImage || !selectedCropForAnalysis || selectedCropForAnalysis === ''}
            >
              {analyzingImage ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Image
                    source={require('../assets/ai.png')}
                    style={styles.iconImageLarge}
                  />
                  <Text style={styles.aiTitle}>AI Analysis</Text>
                  <Text style={styles.aiDesc}>Advanced crop disease detection</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={selectedCropForAnalysis}
                      onValueChange={(itemValue) => setSelectedCropForAnalysis(itemValue)}
                      style={styles.cropPicker}
                      itemStyle={styles.pickerItem}
                    >
                      {cropsForAnalysis.map((crop) => (
                        <Picker.Item key={crop.value} label={crop.label} value={crop.value} />
                      ))}
                    </Picker>
                  </View>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.treatmentCard} activeOpacity={0.8}>
              <Image
                source={require('../assets/treatment.png')}
                style={styles.iconImageLarge}
              />
              <Text style={styles.aiTitle}>Treatment</Text>
              <Text style={styles.aiDesc}>Personalized care recommendations</Text>
            </TouchableOpacity>
          </Animated.View>
          

          {/* AI Analysis Result Display */}
          {aiAnalysisResult && (
            <View style={styles.aiResultCard}>
              <Text style={styles.aiResultTitle}>AI Analysis Result</Text>
              <Text style={styles.aiResultText}>{aiAnalysisResult}</Text>
            </View>
          )}

          {aiAnalysisError && (
            <View style={styles.aiErrorCard}>
              <Text style={styles.aiErrorText}>{aiAnalysisError}</Text>
            </View>
          )}

          {/* Soil Parameters Section */}
          <Animated.View
            style={[
              styles.soilParametersContainer,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🌱 Soil Parameters</Text>
              <Text style={styles.sectionSubtitle}>Monitor your soil health</Text>
            </View>

            {/* Crop Selection Buttons for Soil Recommendations */}
            


            <View style={styles.parameterGrid}>
              {/* Moisture Card */}
              <View style={[styles.parameterCard, styles.moistureCard]}>
                <View style={styles.parameterHeader}>
                  <View style={styles.parameterIcon}>
                    <Text style={styles.parameterEmoji}>💧</Text>
                  </View>
                  <View style={styles.parameterInfo}>
                    <Text style={styles.parameterLabel}>Soil Moisture</Text>
                    <Text style={styles.parameterUnit}>Percentage (%)</Text>
                  </View>
                </View>
                <TextInput
                  style={styles.parameterInput}
                  value={moisture}
                  onChangeText={setMoisture}
                  placeholder="eg. 50"
                  placeholderTextColor="#A5D6A7"
                  keyboardType="numeric"
                />
                <View style={[styles.statusIndicator, { backgroundColor: getParameterStatus(moisture, 'moisture').color }]}>
                  <Text style={styles.statusText}>{getParameterStatus(moisture, 'moisture').text}</Text>
                </View>
              </View>
              {/* Temperature Card */}
              <View style={[styles.parameterCard, styles.temperatureCard]}>
                <View style={styles.parameterHeader}>
                  <View style={styles.parameterIcon}>
                    <Text style={styles.parameterEmoji}>🌡️</Text>
                  </View>
                  <View style={styles.parameterInfo}>
                    <Text style={styles.parameterLabel}>Soil Temperature</Text>
                    <Text style={styles.parameterUnit}>Celsius (°C)</Text>
                  </View>
                </View>
                <TextInput
                  style={styles.parameterInput}
                  value={temperature}
                  onChangeText={setTemperature}
                  placeholder="eg. 35"
                  placeholderTextColor="#FFCC80"
                  keyboardType="numeric"
                />
                <View style={[styles.statusIndicator, { backgroundColor: getParameterStatus(temperature, 'temperature').color }]}>
                  <Text style={styles.statusText}>{getParameterStatus(temperature, 'temperature').text}</Text>
                </View>
              </View>
              {/* pH Level Card */}
              <View style={[styles.parameterCard, styles.phCard]}>
                <View style={styles.parameterHeader}>
                  <View style={styles.parameterIcon}>
                    <Text style={styles.parameterEmoji}>⚗️</Text>
                  </View>
                  <View style={styles.parameterInfo}>
                    <Text style={styles.parameterLabel}>pH Level</Text>
                    <Text style={styles.parameterUnit}>Acidity (0-14)</Text>
                  </View>
                </View>
                <TextInput
                  style={styles.parameterInput}
                  value={ph}
                  onChangeText={setPh}
                  placeholder="eg. 7"
                  placeholderTextColor="#CE93D8"
                  keyboardType="numeric"
                />
                <View style={[styles.statusIndicator, { backgroundColor: getParameterStatus(ph, 'ph').color }]}>
                  <Text style={styles.statusText}>{getParameterStatus(ph, 'ph').text}</Text>
                </View>
              </View>
              {/* Nitrogen Card */}
              <View style={[styles.parameterCard, styles.nitrogenCard]}>
                <View style={styles.parameterHeader}>
                  <View style={styles.parameterIcon}>
                    <Text style={styles.parameterEmoji}>🧪</Text>
                  </View>
                  <View style={styles.parameterInfo}>
                    <Text style={styles.parameterLabel}>Nitrogen Level</Text>
                    <Text style={styles.parameterUnit}>PPM (mg/kg)</Text>
                  </View>
                </View>
                <TextInput
                  style={styles.parameterInput}
                  value={nitrogen}
                  onChangeText={setNitrogen}
                  placeholder="eg. 35"
                  placeholderTextColor="#90CAF9"
                  keyboardType="numeric"
                />
                <View style={[styles.statusIndicator, { backgroundColor: getParameterStatus(nitrogen, 'nitrogen').color }]}>
                  <Text style={styles.statusText}>{getParameterStatus(nitrogen, 'nitrogen').text}</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Get Recommendations Button */}
          <TouchableOpacity
            style={styles.getRecommendationsButton}
            onPress={getSoilRecommendations}
            disabled={loadingRecommendations}
            activeOpacity={0.8}
          >
            {loadingRecommendations ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.getRecommendationsButtonText}>Get Soil Recommendations</Text>
            )}
          </TouchableOpacity>

          {/* Recommendations Display Section */}
          {recommendationError && (
            <View style={styles.recommendationErrorContainer}>
              <Text style={styles.recommendationErrorText}>{recommendationError}</Text>
            </View>
          )}
          {recommendations && (
            <View style={styles.recommendationsCard}>
              <Text style={styles.recommendationsTitle}>AI Soil Recommendations</Text>
              <Text style={styles.recommendationsText}>{recommendations}</Text>
            </View>
          )}
        </ScrollView>

      {/* Floating Chatbot Button (only show if chatbot is closed) */}
      {!chatVisible && (
        <TouchableOpacity
          onPress={() => setChatVisible(true)}
          style={styles.chatToggle}
          activeOpacity={0.8}
        >
          <Image
              source={require('../assets/farmer.png')}
              style={styles.iconImageLarge1}
            />
        </TouchableOpacity>
      )}

      {/* Full-screen Chatbot */}
      {chatVisible && (
        <SurenderChatbot onClose={() => setChatVisible(false)} />
      )}

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  fullScreenGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    flex: 1,
    padding: 20,
    marginBottom:-20,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerContainer: {
    alignItems: 'center',
  },
  farmCard: {
    margin: 'auto',
    marginBottom: 25,
    borderRadius: 18,
    width: '95%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 6,
    marginHorizontal: 20,
    textAlign: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontSize: 25,
    fontWeight: 'bold',
    marginHorizontal: 10,
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  emoji: {
    fontSize: 22,
  },
  uploadCard: {
    backgroundColor: '#D6F5DC',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#76B947',
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    width: '100%',
    marginBottom: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  uploadText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
    color: '#2C3E50',
  },
  uploadHint: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    width: '100%',
    gap: 10,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C8E6C9',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  optionButton1: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#09832c',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
    marginLeft: 8,
  },
  optionText1: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginLeft: 8,
  },
  soilParametersContainer: {
    width: '100%',
    marginBottom: 25,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A3C34',
    textAlign: 'center',
    justifyContent:'center',
    alignItems:'center',
    marginTop:3,
    margin:'auto',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#323432',
    textAlign: 'center',
    marginTop: 4,
  },
  parameterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  parameterCard: {
    width: (width - (20 * 2) - 15) / 2,
    borderRadius: 16,
    padding: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    marginBottom: 15,
  },
  moistureCard: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  temperatureCard: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  phCard: {
    backgroundColor: '#F3E5F5',
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  nitrogenCard: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  parameterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  parameterIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  parameterEmoji: {
    fontSize: 20,
  },
  parameterInfo: {
    flex: 1,
  },
  parameterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A3C34',
  },
  parameterUnit: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  parameterInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(118, 185, 71, 0.3)',
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  getRecommendationsButton: {
    backgroundColor: '#388E3C',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  getRecommendationsButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  recommendationsCard: {
    backgroundColor: '#E0F2F7',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderLeftWidth: 5,
    borderLeftColor: '#03A9F4',
  },
  recommendationsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#01579B',
    marginBottom: 10,
    textAlign: 'center',
  },
  recommendationsText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  recommendationErrorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 15,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F44336',
    alignItems: 'center',
  },
  recommendationErrorText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
    gap: 15,
  },
  aiCard: {
    backgroundColor: '#43A047',
    flex: 1,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  treatmentCard: {
    backgroundColor: '#FB8C00',
    flex: 1,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
  },
  aiDesc: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.9,
  },
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    marginTop: 20,
    marginBottom: 25,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 15,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
  },
  removeImageEmoji: {
    fontSize: 20,
    color: '#F44336',
  },
  iconImageLarge: {
    width: 40,
    height: 40,
  },
  iconImageRegular: {
    width: 24,
    height: 24,
  },
  chatToggle: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#43A047',
    padding: 14,
    borderRadius: 30,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 10,
    marginBottom:69,
  },
  chatContainer: {
    position: 'absolute',
    bottom: 0,
    height: '50%',
    width: '100%',
    backgroundColor: '#F0F4EF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  iconImageLarge1:{
    width:30,
    height:30,
  },
  marketPriceSection: {
    width: '100%',
    marginBottom: 25,
    backgroundColor: '#E8F5E9',
    borderRadius: 18,
    paddingVertical: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  marketPriceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  viewAllPricesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  viewAllPricesText: {
    color: '#03A9F4',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  marketPriceScroll: {
    paddingHorizontal: 10,
  },
  cropPriceCard: {
    width: width * 0.38,
    borderRadius: 15,
    padding: 10,
    marginHorizontal: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftColor: '#29ca9f',
    flexShrink: 0,
    height: 140,
  },
  cropPriceCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 0,
  },
  cropPriceEmoji: {
    fontSize: 32,
    marginRight: 8,
  },
  cropInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  cropPriceName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'left',
    marginBottom: 2,
  },
  cropPriceValue: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1A3C34',
    marginBottom: 2,
  },
  cropPriceTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cropPriceTrendIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  cropPriceTrendText: {
    fontSize: 12,
    color: '#666',
  },
  cropPriceMandi: {
    fontSize: 11,
    color: '#555',
    textAlign: 'center',
    marginTop: -5,
    marginRight:10
  },
  cropPriceUpdated: {
    fontSize: 9,
    color: '#888',
    marginTop: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  pickerContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    marginTop: 10,
    width: '90%',
    overflow: 'hidden',
  },
  cropPicker: {
    height: 40,
    width: '100%',
    color: '#fff',
  },
  pickerItem: {
    fontSize: 14,
    color: '#fff',
    height: 40,
  },
  disabledButton: {
    opacity: 0.6,
  },
  aiResultCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
  },
  aiResultTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 10,
    textAlign: 'center',
  },
  aiResultText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    textAlign: 'center',
  },
  aiErrorCard: {
    backgroundColor: '#FFEBEE',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderLeftWidth: 5,
    borderLeftColor: '#F44336',
  },
  aiErrorText: {
    fontSize: 16,
    color: '#D32F2F',
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '600',
  },
  soilCropButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
    marginTop: 10,
    paddingHorizontal: 5,
  },
  soilCropButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#B0BEC5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  soilCropButtonSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#2E7D32',
  },
  soilCropButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  soilCropButtonTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  // --- New Styles for Date Input ---
  dateInputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#76B947',
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginTop: 15,
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInputText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  dateInputHint: {
    fontSize: 12,
    color: '#777',
  },
});

export default Dashboard;