/**
 * Main App Component
 */

import React from 'react';
import { StatusBar, Platform } from 'react-native';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/constants';
import './src/services/voipService';

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <StatusBar
          barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
          backgroundColor={COLORS.primary}
        />
        <AppNavigator />
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;
