import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  BackHandler,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useAuth } from './hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const Home: React.FC = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    const backAction = () => {
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/components/Dashboard/dashboard');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <Image
          source={require('../assets/images/bgg.png')}
          style={styles.headerBg}
        />
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['rgba(79, 70, 229, 0.1)', 'rgba(79, 70, 229, 0.2)']}
              style={styles.logoWrapper}
            >
              <Ionicons name="wallet-outline" size={48} color="#4f46e5" />
            </LinearGradient>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.headerText}>Finance AI</Text>
            <Text style={styles.subHeaderText}>
              Manage your finances smarter with AI
            </Text>

            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <Ionicons name="bar-chart-outline" size={24} color="#4f46e5" />
                <Text style={styles.featureText}>Smart Analytics</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="chatbubble-outline" size={24} color="#4f46e5" />
                <Text style={styles.featureText}>AI Assistant</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="camera-outline" size={24} color="#4f46e5" />
                <Text style={styles.featureText}>Receipt Scanner</Text>
              </View>
            </View>

            {/* Update Get Started button to go to register */}
            <Link href="/components/Auth/register" asChild>
              <TouchableOpacity style={styles.loginButton}>
                <LinearGradient
                  colors={['#4f46e5', '#3d2e9c']}
                  style={styles.gradientButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.buttonText}>Get Started</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Link>

            {/* Update second button to go to login */}
            <Link href="/components/Auth/login" asChild>
              <TouchableOpacity style={styles.createAccountButton}>
                <Text style={styles.createAccountText}>Sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  headerWrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  headerBg: {
    position: 'absolute',
    width: '100%',
    height: '108%',
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  formContainer: {
    backgroundColor: 'rgba(23, 23, 23, 0.8)',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  headerText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subHeaderText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 32,
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  featureText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
  loginButton: {
    width: '100%',
    marginBottom: 12,
  },
  gradientButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  createAccountButton: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.5)',
    borderRadius: 12,
  },
  createAccountText: {
    color: '#4f46e5',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#09090b',
  },
});

export default Home;