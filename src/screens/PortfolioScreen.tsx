/**
 * PortfolioScreen: completed work, presented as a record.
 *
 * UX & Animation principles applied:
 *   - Miller's law (#16) & Secondary action (#8): each milestone shows a subtle
 *     progress gauge so locked achievements clearly show how close you are.
 *   - Tactile feedback (#1) & Bigger hit areas (#14): tapping a milestone row
 *     expands/highlights its progress status cleanly.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ProgressRule } from '@/components/ProgressRule';
import { Rule } from '@/components/Rule';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { StatBlock } from '@/components/StatBlock';
import { Text } from '@/components/Text';
import { useActivities } from '@/data/ActivityContext';
import type { Activity } from '@/data/types';
import {
  formatActivityNumber,
  formatLongDate,
  formatMonthYear,
  formatPercent,
} from '@/lib/format';
import { useTheme } from '@/theme/ThemeContext';

export interface PortfolioScreenProps {
  onOpenActivity: (id: string) => void;
}

export function PortfolioScreen({ onOpenActivity }: PortfolioScreenProps) {
  const theme = useTheme();
  const { profile, stats, getProgress } = useActivities();
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);

  const timeline = useMemo(() => {
    const groups = new Map<string, Activity[]>();

    for (const activity of stats.completedActivities) {
      const key = activity.completedAt ? formatMonthYear(activity.completedAt) : 'Undated';
      const existing = groups.get(key);
      if (existing) {
        existing.push(activity);
      } else {
        groups.set(key, [activity]);
      }
    }

    return Array.from(groups.entries()).map(([month, items]) => ({ month, items }));
  }, [stats.completedActivities]);

  const achievements = useMemo(() => {
    return [
      {
        id: 'first',
        title: 'First completed activity',
        detail: 'Finish any laboratory activity end to end.',
        earned: stats.complete >= 1,
        progressRatio: Math.min(1, stats.complete / 1),
        progressLabel: `${Math.min(stats.complete, 1)} of 1 activity`,
      },
      {
        id: 'five',
        title: 'Five activities complete',
        detail: 'Build a working record across the period.',
        earned: stats.complete >= 5,
        progressRatio: Math.min(1, stats.complete / 5),
        progressLabel: `${Math.min(stats.complete, 5)} of 5 activities`,
      },
      {
        id: 'evidence',
        title: 'Evidence collector',
        detail: 'Attach at least five pieces of evidence.',
        earned: stats.evidenceCount >= 5,
        progressRatio: Math.min(1, stats.evidenceCount / 5),
        progressLabel: `${Math.min(stats.evidenceCount, 5)} of 5 items`,
      },
      {
        id: 'clean',
        title: 'Nothing overdue',
        detail: 'Keep every open activity inside its deadline.',
        earned: stats.overdue === 0 && stats.total > 0,
        progressRatio: stats.overdue === 0 && stats.total > 0 ? 1 : 0,
        progressLabel:
          stats.overdue === 0
            ? 'All deadlines on track'
            : `${stats.overdue} overdue ${stats.overdue === 1 ? 'activity' : 'activities'}`,
      },
    ];
  }, [stats.complete, stats.evidenceCount, stats.overdue, stats.total]);

  const earnedCount = achievements.filter((item) => item.earned).length;

  return (
    <Screen
      title="Portfolio"
      subtitle={[profile.displayName, profile.programme].filter(Boolean).join(' · ')}
    >
      {/* ===== Summary ===== */}
      <SectionHeader title="Record" meta={profile.period || undefined} />

      <View
        style={{
          flexDirection: 'row',
          gap: theme.space.md,
          paddingVertical: theme.space.sm,
        }}
      >
        <StatBlock value={String(stats.complete)} label="Completed" tone="complete" />
        <StatBlock value={String(stats.inProgress)} label="In progress" tone="progress" />
        <StatBlock value={String(stats.evidenceCount)} label="Evidence" tone="accent" />
        <StatBlock value={`${earnedCount}/${achievements.length}`} label="Milestones" />
      </View>

      <View style={{ marginTop: theme.space.sm, gap: 6 }}>
        <ProgressRule value={stats.overallRatio} height={4} />
        <Text variant="micro" tone="faint">
          {formatPercent(stats.overallRatio)} of all steps complete ·{' '}
          {stats.stepsDone} of {stats.stepsTotal}
        </Text>
      </View>

      {/* ===== Milestones ===== */}
      <SectionHeader title="Milestones" meta={`${earnedCount} earned`} />

      <View style={{ gap: theme.space.xs }}>
        {achievements.map((item) => {
          const expanded = expandedMilestone === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              accessibilityLabel={`${item.title}. ${item.earned ? 'Earned' : item.progressLabel}`}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setExpandedMilestone(expanded ? null : item.id);
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: theme.space.md,
                paddingVertical: theme.space.sm,
                paddingHorizontal: theme.space.xs,
                borderRadius: theme.radius.sm,
                backgroundColor: pressed ? theme.colors.surfaceSunken : 'transparent',
                opacity: item.earned ? 1 : 0.72,
              })}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: theme.radius.sm,
                  backgroundColor: item.earned
                    ? theme.colors.completeWash
                    : theme.colors.surfaceSunken,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={item.earned ? 'ribbon' : 'lock-closed-outline'}
                  size={15}
                  color={item.earned ? theme.colors.complete : theme.colors.textFaint}
                />
              </View>

              <View style={{ flex: 1, gap: 3 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: theme.space.sm,
                  }}
                >
                  <Text variant="bodySmall" tone={item.earned ? 'default' : 'muted'}>
                    {item.title}
                  </Text>
                  {item.earned ? (
                    <Text variant="micro" tone="complete">
                      Earned
                    </Text>
                  ) : (
                    <Text variant="micro" tone="faint">
                      {item.progressLabel}
                    </Text>
                  )}
                </View>

                <Text variant="micro" tone="faint">
                  {item.detail}
                </Text>

                {!item.earned || expanded ? (
                  <View style={{ marginTop: 4 }}>
                    <ProgressRule
                      value={item.progressRatio}
                      color={item.earned ? theme.colors.complete : theme.colors.accent}
                      height={3}
                    />
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* ===== Timeline ===== */}
      <SectionHeader
        title="Activity timeline"
        meta={`${stats.completedActivities.length} completed`}
      />

      {timeline.length === 0 ? (
        <EmptyState
          icon="briefcase-outline"
          title="No completed work yet"
          description="Activities appear here once every step in their checklist is done. Finish one to start your record."
        />
      ) : (
        <View>
          {timeline.map((group) => (
            <View key={group.month}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.space.sm,
                  paddingTop: theme.space.md,
                  paddingBottom: theme.space.xs,
                }}
              >
                <Text variant="label" tone="muted">
                  {group.month}
                </Text>
                <View
                  style={{ flex: 1, height: 1, backgroundColor: theme.colors.rule }}
                />
                <Text variant="micro" tone="faint">
                  {group.items.length}
                </Text>
              </View>

              {group.items.map((activity, index) => {
                const progress = getProgress(activity);

                return (
                  <View key={activity.id}>
                    {index > 0 ? <Rule /> : null}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${activity.title}, completed ${formatLongDate(activity.completedAt)}`}
                      onPress={() => onOpenActivity(activity.id)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        gap: theme.space.md,
                        paddingVertical: theme.space.md,
                        paddingHorizontal: theme.space.xs,
                        borderRadius: theme.radius.sm,
                        backgroundColor: pressed ? theme.colors.surfaceSunken : 'transparent',
                      })}
                    >
                      <View style={{ width: 30, paddingTop: 2 }}>
                        <Text variant="label" tone="faint">
                          {formatActivityNumber(activity.number)}
                        </Text>
                      </View>

                      <View style={{ flex: 1, gap: 2 }}>
                        <Text variant="heading" numberOfLines={2}>
                          {activity.title}
                        </Text>
                        <Text variant="micro" tone="muted">
                          {activity.course}
                        </Text>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: theme.space.sm,
                            marginTop: 2,
                          }}
                        >
                          <Ionicons
                            name="checkmark-circle"
                            size={13}
                            color={theme.colors.complete}
                          />
                          <Text variant="micro" tone="complete">
                            Completed {formatLongDate(activity.completedAt)}
                          </Text>
                          <Text variant="micro" tone="faint">
                            · {progress.total} steps
                          </Text>
                        </View>
                      </View>

                      <View style={{ justifyContent: 'center' }}>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={theme.colors.textFaint}
                        />
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
