/**
 * LibraryScreen: the full activity collection.
 *
 * UX & Animation principles applied:
 *   - Frequency of use (#20) & Doherty threshold (#17): search and filtering
 *     update instantaneously with zero sluggish per-row re-animations.
 *   - Staging the focus (#3): search field border & tint highlight when focused.
 *   - Hick's law (#15) & Miller's law (#16): clean status strip + category chips.
 *   - Bigger hit areas (#14): >=44pt targets on "+ New", clear search, & chips.
 */

import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityRow } from '@/components/ActivityRow';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { Rule } from '@/components/Rule';
import { Text } from '@/components/Text';
import { useActivities } from '@/data/ActivityContext';
import type { ActivityCategory } from '@/data/types';
import { useLayout } from '@/lib/useLayout';
import { useTheme } from '@/theme/ThemeContext';
import { maxContentWidth } from '@/theme/tokens';

export type LibraryStatusFilter = 'all' | 'in_progress' | 'complete' | 'overdue';

export interface LibraryScreenProps {
  onOpenActivity: (id: string) => void;
  statusFilter: LibraryStatusFilter;
  onChangeStatusFilter: (status: LibraryStatusFilter) => void;
  onAddActivity: () => void;
}

type Filter = ActivityCategory | 'All';

const STATUS_OPTIONS: { key: LibraryStatusFilter; label: string }[] = [
  { key: 'all', label: 'All status' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'complete', label: 'Complete' },
  { key: 'overdue', label: 'Overdue' },
];

export function LibraryScreen({
  onOpenActivity,
  statusFilter,
  onChangeStatusFilter,
  onAddActivity,
}: LibraryScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const layout = useLayout();
  const { activities, stats, getProgress } = useActivities();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const [searchFocused, setSearchFocused] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return activities
      .filter((activity) => {
        if (filter !== 'All' && activity.category !== filter) return false;
        if (statusFilter !== 'all') {
          const prog = getProgress(activity);
          if (statusFilter === 'overdue' && !prog.overdue) return false;
          if (statusFilter === 'complete' && prog.status !== 'complete') return false;
          if (statusFilter === 'in_progress' && prog.status !== 'in_progress') return false;
        }
        if (needle.length === 0) return true;
        return (
          activity.title.toLowerCase().includes(needle) ||
          activity.course.toLowerCase().includes(needle) ||
          activity.category.toLowerCase().includes(needle) ||
          activity.summary.toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => a.number - b.number);
  }, [activities, filter, getProgress, query, statusFilter]);

  const isFiltering =
    query.trim().length > 0 || filter !== 'All' || statusFilter !== 'all';

  const clearFilters = () => {
    setQuery('');
    setFilter('All');
    onChangeStatusFilter('all');
  };

  const hasActivities = stats.total > 0;

  const header = (
    <View style={{ paddingTop: theme.space.lg }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: theme.space.md,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text variant="display" accessibilityRole="header">
            Library
          </Text>
          <Text variant="bodySmall" tone="muted" style={{ marginTop: 2 }}>
            {hasActivities
              ? `${stats.total} ${stats.total === 1 ? 'activity' : 'activities'} · ${stats.complete} complete`
              : 'No activities yet'}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add new laboratory activity"
          onPress={onAddActivity}
          hitSlop={6}
          style={({ pressed }) => ({
            minHeight: 44,
            paddingHorizontal: theme.space.md,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: theme.colors.accent,
            backgroundColor: pressed ? theme.colors.accentWash : theme.colors.surface,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
          })}
        >
          <Ionicons name="add" size={18} color={theme.colors.accentText} />
          <Text variant="label" tone="accent">
            New
          </Text>
        </Pressable>
      </View>

      {hasActivities ? (
        <>
      {/* Search */}
      <View
        style={{
          marginTop: theme.space.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space.sm,
          borderWidth: searchFocused ? 1.5 : 1,
          borderColor: searchFocused ? theme.colors.accent : theme.colors.rule,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surface,
          paddingHorizontal: theme.space.md,
          minHeight: 48,
        }}
      >
        <Ionicons
          name="search"
          size={17}
          color={searchFocused ? theme.colors.accentText : theme.colors.textMuted}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Search by title, course or category"
          placeholderTextColor={theme.colors.textFaint}
          accessibilityLabel="Search activities"
          returnKeyType="search"
          style={{
            flex: 1,
            color: theme.colors.text,
            fontFamily: theme.fontFamily.body,
            fontSize: 15,
            paddingVertical: theme.space.sm,
          }}
        />
        {query.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => setQuery('')}
            hitSlop={12}
            style={{ minWidth: 32, minHeight: 32, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Status filter strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: theme.space.sm,
          marginTop: theme.space.md,
        }}
      >
        {STATUS_OPTIONS.map((opt) => (
          <Chip
            key={opt.key}
            label={opt.label}
            selected={statusFilter === opt.key}
            onPress={() => onChangeStatusFilter(opt.key)}
          />
        ))}
      </ScrollView>

      {/* Category filter */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: theme.space.sm,
          marginTop: theme.space.sm,
        }}
      >
        {stats.categoryCounts.map((entry) => (
          <Chip
            key={entry.category}
            label={entry.category}
            count={entry.count}
            selected={filter === entry.category}
            onPress={() => setFilter(entry.category)}
          />
        ))}
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: theme.space.lg,
          marginBottom: theme.space.xs,
        }}
      >
        <Text variant="micro" tone="muted">
          {filtered.length} {filtered.length === 1 ? 'activity' : 'activities'}
          {isFiltering ? ' match' : ''}
        </Text>
        {isFiltering ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
            onPress={clearFilters}
            hitSlop={10}
            style={{ minHeight: 32, justifyContent: 'center' }}
          >
            <Text variant="micro" tone="accent">
              Clear filters
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Rule strong />
        </>
      ) : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.canvas, paddingTop: insets.top }}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={{
          paddingHorizontal: layout.gutter,
          paddingBottom: insets.bottom + theme.space.xxl,
          width: '100%',
          maxWidth: maxContentWidth,
          alignSelf: 'center',
        }}
        ItemSeparatorComponent={() => <Rule />}
        renderItem={({ item }) => (
          <ActivityRow
            activity={item}
            progress={getProgress(item)}
            onPress={() => onOpenActivity(item.id)}
          />
        )}
        ListEmptyComponent={
          hasActivities ? (
          <EmptyState
            icon="search"
            title="No activities match"
            description={
              query.trim().length > 0
                ? `Nothing matches “${query.trim()}” with the current filters.`
                : 'No activities match this filter yet.'
            }
            actionLabel={isFiltering ? 'Clear filters' : undefined}
            onAction={isFiltering ? clearFilters : undefined}
          />
          ) : (
          <EmptyState
            icon="albums-outline"
            title="Your library is empty"
            description="Activities you add are listed here, ready to search and filter. Use New above to add one."
          />
          )
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
