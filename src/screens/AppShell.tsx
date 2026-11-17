/**
 * AppShell: the tabbed application & interactive detail layer.
 *
 * UX & Animation principles applied:
 *   - Frequency of use (#20) & Doherty threshold (#17): Tab screens stay
 *     mounted so switching tabs is instantaneous and scroll/filter state survives.
 *   - Staging & Solid drawing in 3D (#3, #11): Opening an activity slides the
 *     detail sheet in from the right while subtly receding the underlying deck.
 *   - Jakob's law (#19) & Postel's law (#18): Supports edge swipe-back gesture
 *     (1:1 finger tracking + velocity projection) AND hardware back button.
 */

import { useCallback, useEffect, useState } from 'react';
import { BackHandler, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { AddActivitySheet } from '@/components/AddActivitySheet';
import { TabBar } from '@/components/TabBar';
import { ToastHost } from '@/components/ToastHost';
import { useActivities } from '@/data/ActivityContext';
import { useMotionConfig } from '@/lib/motion';
import { ActivityDetailScreen } from '@/screens/ActivityDetailScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { LibraryScreen, type LibraryStatusFilter } from '@/screens/LibraryScreen';
import { PortfolioScreen } from '@/screens/PortfolioScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { useTheme } from '@/theme/ThemeContext';

type TabKey = 'index' | 'library' | 'portfolio' | 'settings';

export function AppShell() {
  const theme = useTheme();
  const motion = useMotionConfig();
  const { width: screenWidth } = useWindowDimensions();
  const { stats } = useActivities();

  const [activeTab, setActiveTab] = useState<TabKey>('index');
  const [openActivityId, setOpenActivityId] = useState<string | null>(null);
  const [libraryStatusFilter, setLibraryStatusFilter] =
    useState<LibraryStatusFilter>('all');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  const detailTranslateX = useSharedValue(screenWidth);

  const openActivity = useCallback(
    (id: string) => {
      setOpenActivityId(id);
      if (motion.reduced) {
        detailTranslateX.set(0);
      } else {
        detailTranslateX.set(screenWidth);
        detailTranslateX.set(withSpring(0, motion.springs.snappy));
      }
    },
    [detailTranslateX, motion.reduced, motion.springs.snappy, screenWidth],
  );

  const finishCloseActivity = useCallback(() => {
    setOpenActivityId(null);
  }, []);

  const closeActivity = useCallback(() => {
    if (motion.reduced) {
      setOpenActivityId(null);
      return;
    }
    detailTranslateX.set(
      withTiming(
        screenWidth,
        { duration: motion.timing.quick, easing: motion.easing.exit },
        (finished) => {
          if (finished) {
            scheduleOnRN(finishCloseActivity);
          }
        },
      ),
    );
  }, [
    detailTranslateX,
    finishCloseActivity,
    motion.easing.exit,
    motion.reduced,
    motion.timing.quick,
    screenWidth,
  ]);

  // Android hardware back closes the detail view or add sheet before exiting.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isAddSheetOpen) {
        setIsAddSheetOpen(false);
        return true;
      }
      if (openActivityId) {
        closeActivity();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [closeActivity, isAddSheetOpen, openActivityId]);

  const switchTab = useCallback((key: string) => {
    setOpenActivityId(null);
    setActiveTab(key as TabKey);
  }, []);

  const openLibraryWithStatus = useCallback((status: LibraryStatusFilter = 'all') => {
    setLibraryStatusFilter(status);
    setOpenActivityId(null);
    setActiveTab('library');
  }, []);

  // Left-edge swipe-to-go-back gesture on the detail screen.
  const edgeSwipeBack = Gesture.Pan()
    .activeOffsetX(14)
    .failOffsetY([-18, 18])
    .hitSlop({ left: 0, width: 42 })
    .onUpdate((event) => {
      if (event.translationX > 0) {
        detailTranslateX.set(event.translationX);
      }
    })
    .onEnd((event) => {
      const shouldDismiss =
        event.translationX > screenWidth * 0.32 || event.velocityX > 650;
      if (shouldDismiss) {
        if (motion.reduced) {
          scheduleOnRN(finishCloseActivity);
        } else {
          detailTranslateX.set(
            withTiming(
              screenWidth,
              { duration: motion.timing.quick, easing: motion.easing.exit },
              (finished) => {
                if (finished) {
                  scheduleOnRN(finishCloseActivity);
                }
              },
            ),
          );
        }
      } else {
        detailTranslateX.set(withSpring(0, motion.springs.snappy));
      }
    });

  // Subtle depth recession on the tab shell when detail view slides over it.
  const shellDepthStyle = useAnimatedStyle(() => {
    if (!openActivityId || motion.reduced) {
      return {
        transform: [{ scale: 1 }],
        opacity: 1,
      };
    }
    const progress = interpolate(
      detailTranslateX.value,
      [0, screenWidth],
      [1, 0],
      'clamp',
    );
    return {
      transform: [{ scale: interpolate(progress, [0, 1], [1, 0.965]) }],
      opacity: interpolate(progress, [0, 1], [1, 0.72]),
    };
  });

  const detailSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: detailTranslateX.value }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.canvas }}>
      <Animated.View style={[{ flex: 1 }, shellDepthStyle]}>
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1, display: activeTab === 'index' ? 'flex' : 'none' }}>
            <HomeScreen
              onOpenActivity={openActivity}
              onOpenLibrary={openLibraryWithStatus}
            />
          </View>
          <View style={{ flex: 1, display: activeTab === 'library' ? 'flex' : 'none' }}>
            <LibraryScreen
              onOpenActivity={openActivity}
              statusFilter={libraryStatusFilter}
              onChangeStatusFilter={setLibraryStatusFilter}
              onAddActivity={() => setIsAddSheetOpen(true)}
            />
          </View>
          <View style={{ flex: 1, display: activeTab === 'portfolio' ? 'flex' : 'none' }}>
            <PortfolioScreen onOpenActivity={openActivity} />
          </View>
          <View style={{ flex: 1, display: activeTab === 'settings' ? 'flex' : 'none' }}>
            <SettingsScreen />
          </View>
        </View>

        <TabBar
          activeKey={activeTab}
          onSelect={switchTab}
          overdueCount={stats.overdue}
        />
      </Animated.View>

      {openActivityId ? (
        <GestureDetector gesture={edgeSwipeBack}>
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: theme.colors.canvas,
                shadowColor: '#000',
                shadowOpacity: 0.16,
                shadowRadius: 16,
                shadowOffset: { width: -4, height: 0 },
                elevation: 8,
              },
              detailSlideStyle,
            ]}
          >
            <ActivityDetailScreen activityId={openActivityId} onBack={closeActivity} />
          </Animated.View>
        </GestureDetector>
      ) : null}

      <AddActivitySheet
        visible={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        onCreated={openActivity}
      />

      <ToastHost aboveTabBar={!openActivityId} />
    </View>
  );
}
