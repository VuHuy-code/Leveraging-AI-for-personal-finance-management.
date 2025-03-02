import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  BackHandler,
  Image,
  StatusBar,
  Animated,
  Platform,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useAuth } from './hooks/useAuth';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

const Home: React.FC = () => {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  // Splash screen animation values
  const splashFadeAnim = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(20)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  // Main content animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const featureAnimations = [
    useRef(new Animated.Value(100)).current,
    useRef(new Animated.Value(100)).current,
    useRef(new Animated.Value(100)).current,
  ];

  // Handle splash screen animations
  useEffect(() => {
    // Start with logo animation
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    // After short delay, animate text
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(textSlide, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }, 400);

    // Animate progress bar
    Animated.timing(progressWidth, {
      toValue: 1,
      duration: 2400,
      useNativeDriver: false,
    }).start();

    // After splash duration, fade out splash and show main content
    setTimeout(() => {
      Animated.timing(splashFadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setShowSplash(false);

        // Animate main content
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]).start();

        // Staggered animation for features
        Animated.stagger(200,
          featureAnimations.map(anim =>
            Animated.spring(anim, {
              toValue: 0,
              friction: 8,
              tension: 50,
              useNativeDriver: true,
            })
          )
        ).start();
      });
    }, 2800);
  }, []);

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
        <StatusBar barStyle="light-content" backgroundColor="#09090b" />
        <LinearGradient
          colors={['#09090b', '#1a1a2e']}
          style={styles.loadingGradient}
        >
          <Image
            source={require('../assets/images/bgg.png')}
            style={[styles.headerBg, { opacity: 0.3 }]}
            blurRadius={10}
          />
          <View style={styles.loadingContent}>
            <LinearGradient
              colors={['rgba(79, 70, 229, 0.2)', 'rgba(79, 70, 229, 0.4)']}
              style={styles.loadingLogoWrapper}
            >
              <Ionicons name="wallet-outline" size={36} color="#6c63ff" />
            </LinearGradient>
            <ActivityIndicator size="large" color="#6c63ff" style={styles.loadingIndicator} />
            <Text style={styles.loadingText}>Loading your financial world...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {showSplash ? (
        <Animated.View style={[styles.splashContainer, { opacity: splashFadeAnim }]}>
          <Image
            source={require('../assets/images/bgg.png')}
            style={styles.splashBg}
            blurRadius={5}
          />
          <LinearGradient
            colors={['rgba(9, 9, 11, 0.7)', 'rgba(9, 9, 11, 0.9)']}
            style={styles.splashOverlay}
          />

          <Animated.View
            style={[
              styles.splashLogoContainer,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }]
              }
            ]}
          >
            <LinearGradient
              colors={['rgba(108, 99, 255, 0.8)', '#4f46e5']}
              style={styles.splashLogoWrapper}
            >
              <Ionicons name="wallet-outline" size={64} color="#fff" />
            </LinearGradient>

            <Animated.View
              style={[
                styles.splashTextContainer,
                {
                  opacity: textOpacity,
                  transform: [{ translateY: textSlide }]
                }
              ]}
            >
              <Text style={styles.splashAppName}>Finance AI</Text>
              <Text style={styles.splashTagline}>Smart money management</Text>
            </Animated.View>
          </Animated.View>

          <View style={styles.splashLoadingContainer}>
            <View style={styles.splashLoadingBar}>
              <Animated.View
                style={[
                  styles.splashLoadingProgress,
                  {
                    width: progressWidth.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    })
                  }
                ]}
              />
            </View>
          </View>
        </Animated.View>
      ) : (
        <View style={styles.headerWrapper}>
          <Image
            source={require('../assets/images/bgg.png')}
            style={styles.headerBg}
          />

          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}
          >
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['rgba(79, 70, 229, 0.2)', 'rgba(79, 70, 229, 0.6)']}
                style={styles.logoWrapper}
              >
                <Ionicons name="wallet-outline" size={48} color="#fff" />
              </LinearGradient>
            </View>

            <BlurView intensity={Platform.OS === 'ios' ? 60 : 100} tint="dark" style={styles.formContainer}>
              <Text style={styles.headerText}>Finance AI</Text>
              <Text style={styles.subHeaderText}>
                Manage your finances smarter with AI
              </Text>

              <View style={styles.featuresContainer}>
                <Animated.View
                  style={[
                    styles.featureItem,
                    { transform: [{ translateX: featureAnimations[0] }] }
                  ]}
                >
                  <LinearGradient
                    colors={['#6c63ff', '#4f46e5']}
                    style={styles.featureIconContainer}
                  >
                    <Ionicons name="bar-chart-outline" size={22} color="#fff" />
                  </LinearGradient>
                  <View style={styles.featureTextContainer}>
                    <Text style={styles.featureText}>Smart Analytics</Text>
                    <Text style={styles.featureDescription}>Track spending patterns and trends</Text>
                  </View>
                </Animated.View>

                <Animated.View
                  style={[
                    styles.featureItem,
                    { transform: [{ translateX: featureAnimations[1] }] }
                  ]}
                >
                  <LinearGradient
                    colors={['#6c63ff', '#4f46e5']}
                    style={styles.featureIconContainer}
                  >
                    <Ionicons name="chatbubble-outline" size={22} color="#fff" />
                  </LinearGradient>
                  <View style={styles.featureTextContainer}>
                    <Text style={styles.featureText}>AI Assistant</Text>
                    <Text style={styles.featureDescription}>Get personalized financial advice</Text>
                  </View>
                </Animated.View>

                <Animated.View
                  style={[
                    styles.featureItem,
                    { transform: [{ translateX: featureAnimations[2] }] }
                  ]}
                >
                  <LinearGradient
                    colors={['#6c63ff', '#4f46e5']}
                    style={styles.featureIconContainer}
                  >
                    <Ionicons name="camera-outline" size={22} color="#fff" />
                  </LinearGradient>
                  <View style={styles.featureTextContainer}>
                    <Text style={styles.featureText}>Receipt Scanner</Text>
                    <Text style={styles.featureDescription}>Automatically track expenses from photos</Text>
                  </View>
                </Animated.View>
              </View>

              {/* Get Started button */}
              <Link href="/components/Auth/register" asChild>
                <TouchableOpacity
                  style={styles.loginButton}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#6c63ff', '#4f46e5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.buttonText}>Get Started</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </Link>

              {/* Sign in button */}
              <Link href="/components/Auth/login" asChild>
                <TouchableOpacity
                  style={styles.createAccountButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.createAccountText}>Already have an account? Sign in</Text>
                </TouchableOpacity>
              </Link>
            </BlurView>

            <View style={styles.footer}>
              <Text style={styles.footerText}>© 2025 Finance AI • All rights reserved</Text>
            </View>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 10 : 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  formContainer: {
    borderRadius: 24,
    padding: 28,
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  headerText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subHeaderText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
  },
  loginButton: {
    width: '100%',
    marginBottom: 16,
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  gradientButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  createAccountButton: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
    borderRadius: 16,
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
  },
  createAccountText: {
    color: '#6c63ff',
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingIndicator: {
    marginBottom: 16,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.8,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  },

  // Splash screen styles
  splashContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  splashBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  splashOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  splashLogoContainer: {
    alignItems: 'center',
  },
  splashLogoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
    marginBottom: 24,
  },
  splashTextContainer: {
    alignItems: 'center',
  },
  splashAppName: {
    fontSize: 42,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 8,
  },
  splashTagline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
  },
  splashLoadingContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    width: '70%',
    alignItems: 'center',
  },
  splashLoadingBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  splashLoadingProgress: {
    height: '100%',
    backgroundColor: '#6c63ff',
    borderRadius: 2,
  },
});

export default Home;
