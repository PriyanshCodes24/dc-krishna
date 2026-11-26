import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Alert, Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const scheduleEventReminder = async (
  title: string,
  venue: string,
  eventDateStr: string
) => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Enable notifications in phone settings to set reminders.');
      return;
    }

    const isExpoGo = Constants.appOwnership === 'expo';

    if (Platform.OS === 'android' && !isExpoGo) {
      try {
        await Notifications.setNotificationChannelAsync('society-events', {
          name: 'Society Events & Meetings',
          importance: Notifications.AndroidImportance.HIGH,
        });
      } catch (channelErr) {
        console.warn('Skipping custom channel:', channelErr);
      }
    }

    const eventDate = new Date(eventDateStr);
    const oneHourBefore = new Date(eventDate.getTime() - 60 * 60 * 1000);
    const triggerDate =
      oneHourBefore.getTime() > Date.now()
        ? oneHourBefore
        : new Date(Date.now() + 10 * 1000);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Reminder: ${title}`,
        body: `Venue: ${venue} • Starts at ${eventDate.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        })}`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        ...(Platform.OS === 'android' && !isExpoGo ? { channelId: 'society-events' } : {}),
      },
    });

    Alert.alert(
      'Reminder Set',
      `You will be notified on ${triggerDate.toLocaleDateString('en-IN')} at ${triggerDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })}.`
    );
  } catch (err: any) {
    Alert.alert(
      'Expo Go Limitation',
      'Local scheduled notifications require a development build (APK) on Android. Reminders will work automatically once we build the APK!'
    );
  }
};