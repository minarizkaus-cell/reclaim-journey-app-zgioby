
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { CalendarEvent } from '@/types/models';
import { authenticatedGet, authenticatedPost, authenticatedDelete } from '@/utils/api';
import dayjs from 'dayjs';

export default function CalendarScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;

  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDateEvents, setSelectedDateEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState('60');

  useEffect(() => {
    loadMonthEvents();
  }, [currentMonth]);

  useEffect(() => {
    if (selectedDate) {
      filterEventsForDate(selectedDate);
    }
  }, [events, selectedDate]);

  const loadMonthEvents = async () => {
    setLoading(true);
    try {
      const monthStr = currentMonth.format('YYYY-MM');
      console.log('[Calendar] Loading events for month:', monthStr);
      const response = await authenticatedGet(`/api/calendar-events?month=${monthStr}`);
      setEvents(response as CalendarEvent[]);
      console.log('[Calendar] Loaded events:', response);
    } catch (error) {
      console.error('[Calendar] Error loading calendar events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const filterEventsForDate = (date: string) => {
    const filtered = events.filter(event => event.date === date);
    setSelectedDateEvents(filtered);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, 'month'));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.add(1, 'month'));
    setSelectedDate(null);
  };

  const handleDayPress = (date: string) => {
    setSelectedDate(date);
  };

  const handleAddEvent = () => {
    if (!selectedDate) {
      console.log('No date selected');
      return;
    }
    setShowAddModal(true);
  };

  const handleSaveEvent = async () => {
    if (!title.trim()) {
      console.log('[Calendar] Title is required');
      return;
    }

    if (!selectedDate) {
      console.log('[Calendar] No date selected');
      return;
    }

    setLoading(true);
    try {
      const eventData = {
        title: title.trim(),
        description: description.trim() || undefined,
        date: selectedDate,
        time: time,
        duration: parseInt(duration, 10),
        reminder: 30,
        reminder_enabled: true,
      };

      console.log('[Calendar] Creating calendar event:', eventData);
      const newEvent = await authenticatedPost('/api/calendar-events', eventData);
      
      setEvents([...events, newEvent as CalendarEvent]);
      setShowAddModal(false);
      resetForm();
      console.log('[Calendar] Event created successfully:', newEvent);
    } catch (error) {
      console.error('[Calendar] Error creating event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;

    setLoading(true);
    try {
      console.log('[Calendar] Deleting event:', eventToDelete);
      await authenticatedDelete(`/api/calendar-events/${eventToDelete}`);
      
      setEvents(events.filter(e => e.id !== eventToDelete));
      setShowDeleteModal(false);
      setEventToDelete(null);
      console.log('[Calendar] Event deleted successfully');
    } catch (error) {
      console.error('[Calendar] Error deleting event:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (eventId: string) => {
    setEventToDelete(eventId);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTime('09:00');
    setDuration('60');
  };

  const renderCalendarGrid = () => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startDate = startOfMonth.startOf('week');
    const endDate = endOfMonth.endOf('week');

    const days = [];
    let currentDate = startDate;

    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
      days.push(currentDate);
      currentDate = currentDate.add(1, 'day');
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <View style={styles.calendarGrid}>
        {/* Day headers */}
        <View style={styles.weekRow}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <View key={index} style={styles.dayHeader}>
              <Text style={[styles.dayHeaderText, { color: themeColors.textSecondary }]}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar days */}
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {week.map((day, dayIndex) => {
              const dateStr = day.format('YYYY-MM-DD');
              const isCurrentMonth = day.month() === currentMonth.month();
              const isSelected = selectedDate === dateStr;
              const isToday = day.isSame(dayjs(), 'day');
              const hasEvents = events.some(e => e.date === dateStr);
              const dayNumber = day.format('D');

              return (
                <TouchableOpacity
                  key={dayIndex}
                  style={[
                    styles.dayCell,
                    isSelected && { backgroundColor: themeColors.primary },
                    isToday && !isSelected && { borderColor: themeColors.primary, borderWidth: 2 },
                  ]}
                  onPress={() => handleDayPress(dateStr)}
                  disabled={!isCurrentMonth}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      { color: isCurrentMonth ? themeColors.text : themeColors.textSecondary },
                      isSelected && { color: '#FFFFFF' },
                      !isCurrentMonth && { opacity: 0.3 },
                    ]}
                  >
                    {dayNumber}
                  </Text>
                  {hasEvents && isCurrentMonth && (
                    <View
                      style={[
                        styles.eventDot,
                        { backgroundColor: isSelected ? '#FFFFFF' : themeColors.primary },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const renderEventsList = () => {
    if (!selectedDate) {
      return (
        <View style={styles.emptyState}>
          <IconSymbol
            ios_icon_name="calendar"
            android_material_icon_name="calendar-today"
            size={48}
            color={themeColors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
            Select a day to view events
          </Text>
        </View>
      );
    }

    const selectedDateFormatted = dayjs(selectedDate).format('MMMM D, YYYY');

    if (selectedDateEvents.length === 0) {
      return (
        <View style={styles.eventsContainer}>
          <Text style={[styles.selectedDateText, { color: themeColors.text }]}>
            {selectedDateFormatted}
          </Text>
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              No events for this day
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.eventsContainer}>
        <Text style={[styles.selectedDateText, { color: themeColors.text }]}>
          {selectedDateFormatted}
        </Text>
        {selectedDateEvents.map((event) => {
          const eventTime = event.time;
          const eventDuration = `${event.duration} min`;

          return (
            <View
              key={event.id}
              style={[
                styles.eventCard,
                { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 },
              ]}
            >
              <View style={styles.eventHeader}>
                <View style={styles.eventInfo}>
                  <Text style={[styles.eventTitle, { color: themeColors.text }]}>
                    {event.title}
                  </Text>
                  <View style={styles.eventMeta}>
                    <IconSymbol
                      ios_icon_name="clock"
                      android_material_icon_name="access-time"
                      size={14}
                      color={themeColors.textSecondary}
                    />
                    <Text style={[styles.eventTime, { color: themeColors.textSecondary }]}>
                      {eventTime}
                    </Text>
                    <Text style={[styles.eventDuration, { color: themeColors.textSecondary }]}>
                      •
                    </Text>
                    <Text style={[styles.eventDuration, { color: themeColors.textSecondary }]}>
                      {eventDuration}
                    </Text>
                  </View>
                  {event.description && (
                    <Text style={[styles.eventDescription, { color: themeColors.textSecondary }]}>
                      {event.description}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => confirmDelete(event.id)}
                  style={styles.deleteButton}
                >
                  <IconSymbol
                    ios_icon_name="trash"
                    android_material_icon_name="delete"
                    size={20}
                    color={themeColors.error}
                  />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const monthYearText = currentMonth.format('MMMM YYYY');

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Calendar',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        edges={['bottom']}
      >
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={themeColors.primary} />
          </View>
        )}

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Month navigation */}
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.monthButton}>
              <IconSymbol
                ios_icon_name="chevron.left"
                android_material_icon_name="arrow-back"
                size={24}
                color={themeColors.text}
              />
            </TouchableOpacity>
            <Text style={[styles.monthText, { color: themeColors.text }]}>
              {monthYearText}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.monthButton}>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="arrow-forward"
                size={24}
                color={themeColors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Calendar grid */}
          {renderCalendarGrid()}

          {/* Events list */}
          {renderEventsList()}

          {/* Add event button */}
          {selectedDate && (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: themeColors.primary }]}
              onPress={handleAddEvent}
            >
              <IconSymbol
                ios_icon_name="plus"
                android_material_icon_name="add"
                size={24}
                color="#FFFFFF"
              />
              <Text style={styles.addButtonText}>Add Event</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Add Event Modal */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                  Add Event
                </Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <IconSymbol
                    ios_icon_name="xmark"
                    android_material_icon_name="close"
                    size={24}
                    color={themeColors.text}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <Text style={[styles.label, { color: themeColors.text }]}>
                  Title *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                      borderColor: themeColors.border,
                    },
                  ]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Event title"
                  placeholderTextColor={themeColors.textSecondary}
                />

                <Text style={[styles.label, { color: themeColors.text }]}>
                  Description
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                      borderColor: themeColors.border,
                    },
                  ]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Optional description"
                  placeholderTextColor={themeColors.textSecondary}
                  multiline
                  numberOfLines={3}
                />

                <Text style={[styles.label, { color: themeColors.text }]}>
                  Time
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                      borderColor: themeColors.border,
                    },
                  ]}
                  value={time}
                  onChangeText={setTime}
                  placeholder="HH:MM"
                  placeholderTextColor={themeColors.textSecondary}
                />

                <Text style={[styles.label, { color: themeColors.text }]}>
                  Duration (minutes)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                      borderColor: themeColors.border,
                    },
                  ]}
                  value={duration}
                  onChangeText={setDuration}
                  placeholder="60"
                  placeholderTextColor={themeColors.textSecondary}
                  keyboardType="numeric"
                />
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: themeColors.background }]}
                  onPress={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: themeColors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: themeColors.primary }]}
                  onPress={handleSaveEvent}
                  disabled={!title.trim()}
                >
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.deleteModalContent, { backgroundColor: themeColors.card }]}>
              <Text style={[styles.deleteModalTitle, { color: themeColors.text }]}>
                Delete Event?
              </Text>
              <Text style={[styles.deleteModalText, { color: themeColors.textSecondary }]}>
                This action cannot be undone.
              </Text>
              <View style={styles.deleteModalActions}>
                <TouchableOpacity
                  style={[styles.deleteModalButton, { backgroundColor: themeColors.background }]}
                  onPress={() => {
                    setShowDeleteModal(false);
                    setEventToDelete(null);
                  }}
                >
                  <Text style={[styles.deleteModalButtonText, { color: themeColors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteModalButton, { backgroundColor: themeColors.error }]}
                  onPress={handleDeleteEvent}
                >
                  <Text style={[styles.deleteModalButtonText, { color: '#FFFFFF' }]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1000,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 20,
    fontWeight: '700',
  },
  calendarGrid: {
    marginBottom: 24,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 2,
    position: 'relative',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '500',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 4,
  },
  eventsContainer: {
    marginBottom: 20,
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  eventCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  eventTime: {
    fontSize: 14,
  },
  eventDuration: {
    fontSize: 14,
  },
  eventDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  deleteButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalScroll: {
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteModalContent: {
    margin: 20,
    borderRadius: 16,
    padding: 24,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  deleteModalText: {
    fontSize: 16,
    marginBottom: 24,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteModalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
