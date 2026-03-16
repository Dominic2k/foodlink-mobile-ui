import React, { useRef } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  View, 
  Dimensions, 
  FlatList, 
  Pressable, 
  TextInput,
  ImageBackground
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Animated, { 
  FadeInDown, 
  FadeInRight, 
  useSharedValue, 
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  SharedValue
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/shared/components/common/ThemedText';
import { ThemedView } from '@/shared/components/common/ThemedView';
import { useAuth } from '@/features/auth/context/AuthContext';

const { width } = Dimensions.get('window');

const HERO_DATA = [
  {
    id: '1',
    title: 'Bữa ăn lành mạnh cho cả tuần',
    subtitle: 'Khám phá công thức giúp bạn tràn đầy năng lượng',
    image: require('@/assets/images/home/hero_salad.png'),
  },
  {
    id: '2',
    title: 'Hương vị truyền thống Việt Nam',
    subtitle: 'Thưởng thức bát Phở bò nóng hổi chuẩn vị',
    image: require('@/assets/images/home/featured_pho.png'),
  },
  {
    id: '3',
    title: 'Trái cây nhiệt đới tươi mới',
    subtitle: 'Cung cấp vitamin tự nhiên cho làn da sáng mịn',
    image: require('@/assets/images/home/health_tip_fruit.png'),
  },
];

const CATEGORIES = [
  { id: '1', name: 'Lành mạnh', icon: 'leaf-outline' },
  { id: '2', name: 'Nhanh gọn', icon: 'flash-outline' },
  { id: '3', name: 'Chay', icon: 'nutrition-outline' },
  { id: '4', name: 'Protein', icon: 'barbell-outline' },
  { id: '5', name: 'Đồ uống', icon: 'beer-outline' },
];

const FEATURED_RECIPES = [
  {
    id: '1',
    name: 'Salad gà bơ Quinoa',
    time: '20 phút',
    calories: '450 kcal',
    image: require('@/assets/images/home/hero_salad.png'),
  },
  {
    id: '2',
    name: 'Phở Bò Gia Truyền',
    time: '45 phút',
    calories: '600 kcal',
    image: require('@/assets/images/home/featured_pho.png'),
  },
];

const HeroItem = ({ item, index, scrollX, router }: { item: typeof HERO_DATA[0], index: number, scrollX: SharedValue<number>, router: any }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const scale = interpolate(scrollX.value, inputRange, [0.9, 1, 0.9], Extrapolate.CLAMP);
    return { transform: [{ scale }] };
  });

  return (
    <View style={styles.heroItemContainer}>
      <Animated.View style={[styles.heroCard, animatedStyle]}>
        <Image source={item.image} style={styles.heroImage} contentFit="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.heroGradient}
        />
        <View style={styles.heroTextContainer}>
          <ThemedText style={styles.heroTitle}>{item.title}</ThemedText>
          <ThemedText style={styles.heroSubtitle}>{item.subtitle}</ThemedText>
          <Pressable style={styles.heroBtn} onPress={() => router.push('/recommendation')}>
            <ThemedText style={styles.heroBtnText}>Khám phá ngay</ThemedText>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
};

const PaginationDot = ({ index, scrollX }: { index: number, scrollX: SharedValue<number> }) => {
  const animatedDotStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const dotWidth = interpolate(scrollX.value, inputRange, [8, 20, 8], Extrapolate.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.4, 1, 0.4], Extrapolate.CLAMP);
    return { width: dotWidth, opacity };
  });
  return <Animated.View style={[styles.dot, animatedDotStyle]} />;
};

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <ThemedView style={styles.header}>
        <View>
          <ThemedText style={styles.greetingText}>Xin chào,</ThemedText>
          <ThemedText style={styles.userNameText}>{user?.username || 'Người dùng'} 👋</ThemedText>
        </View>
        <Pressable style={styles.notificationBtn}>
          <Ionicons name="notifications-outline" size={24} color="#C1766B" />
          <View style={styles.notifBadge} />
        </Pressable>
      </ThemedView>

      {/* Search Bar */}
      <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Tìm kiếm món ăn, nguyên liệu..."
            style={styles.searchInput}
            placeholderTextColor="#9CA3AF"
          />
          <Pressable style={styles.filterBtn}>
            <Ionicons name="options-outline" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </Animated.View>

      {/* Hero Slider */}
      <Animated.View entering={FadeInDown.delay(400).duration(800)}>
        <Animated.FlatList
          data={HERO_DATA}
          renderItem={({ item, index }) => (
            <HeroItem item={item} index={index} scrollX={scrollX} router={router} />
          )}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          keyExtractor={(item) => item.id}
          style={styles.heroList}
        />
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {HERO_DATA.map((_, index) => (
            <PaginationDot key={index} index={index} scrollX={scrollX} />
          ))}
        </View>
      </Animated.View>

      {/* Categories */}
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>Danh mục</ThemedText>
        <Pressable><ThemedText style={styles.seeAll}>Tất cả</ThemedText></Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {CATEGORIES.map((cat, index) => (
          <Animated.View key={cat.id} entering={FadeInRight.delay(index * 100).duration(600)}>
            <Pressable style={styles.categoryBtn}>
              <View style={styles.categoryIconContainer}>
                <Ionicons name={cat.icon as any} size={24} color="#C1766B" />
              </View>
              <ThemedText style={styles.categoryName}>{cat.name}</ThemedText>
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Featured Section */}
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>Gợi ý phổ biến</ThemedText>
        <Pressable onPress={() => router.push('/recommendation')}>
          <ThemedText style={styles.seeAll}>Mua ngay</ThemedText>
        </Pressable>
      </View>
      <View style={styles.featuredContainer}>
        {FEATURED_RECIPES.map((recipe, index) => (
          <Animated.View key={recipe.id} entering={FadeInDown.delay(600 + index * 100).duration(800)}>
            <Pressable style={styles.recipeCard} onPress={() => router.push('/recommendation')}>
              <Image source={recipe.image} style={styles.recipeImage} />
              <View style={styles.recipeInfo}>
                <ThemedText style={styles.recipeName}>{recipe.name}</ThemedText>
                <View style={styles.recipeMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                    <ThemedText style={styles.metaText}>{recipe.time}</ThemedText>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="flame-outline" size={14} color="#9CA3AF" />
                    <ThemedText style={styles.metaText}>{recipe.calories}</ThemedText>
                  </View>
                </View>
              </View>
              <View style={styles.recipeAddBtn}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </View>
            </Pressable>
          </Animated.View>
        ))}
      </View>

      {/* Health Tip Section */}
      <Animated.View entering={FadeInDown.delay(1000).duration(800)} style={styles.healthTipCard}>
        <ImageBackground 
          source={require('@/assets/images/home/health_tip_fruit.png')} 
          style={styles.healthTipBg}
          imageStyle={{ borderRadius: 20 }}
        >
          <View style={styles.glassLayer}>
            <View style={styles.tipIcon}>
              <Ionicons name="heart" size={20} color="#FFFFFF" />
            </View>
            <View>
              <ThemedText style={styles.tipTitle}>Mẹo sức khỏe</ThemedText>
              <ThemedText style={styles.tipDesc}>Ăn trái cây buổi sáng giúp tăng cường hệ miễn dịch.</ThemedText>
            </View>
          </View>
        </ImageBackground>
      </Animated.View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  greetingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  userNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  notifBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#1F2937',
  },
  filterBtn: {
    backgroundColor: '#C1766B',
    padding: 8,
    borderRadius: 12,
  },
  heroList: {
    marginBottom: 10,
  },
  heroItemContainer: {
    width: width,
    paddingHorizontal: 20,
  },
  heroCard: {
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  heroTextContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 12,
  },
  heroBtn: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  heroBtnText: {
    color: '#1F2937',
    fontWeight: '700',
    fontSize: 12,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C1766B',
    marginHorizontal: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  seeAll: {
    fontSize: 14,
    color: '#C1766B',
    fontWeight: '600',
  },
  categoryScroll: {
    paddingLeft: 20,
    marginBottom: 24,
  },
  categoryBtn: {
    alignItems: 'center',
    marginRight: 24,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(193, 118, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  featuredContainer: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  recipeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  recipeImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  recipeInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
    gap: 4,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  recipeMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  recipeAddBtn: {
    backgroundColor: '#C1766B',
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  healthTipCard: {
    marginHorizontal: 20,
    height: 100,
    borderRadius: 20,
    overflow: 'hidden',
  },
  healthTipBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  glassLayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    marginHorizontal: 15,
    padding: 12,
    borderRadius: 16,
    gap: 12,
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  tipDesc: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    maxWidth: width * 0.6,
  },
});
